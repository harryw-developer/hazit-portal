import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import InvoicePreview from '../../components/InvoicePreview'
import { CURRENCIES, addDays, computeTotals, formatMoney, today } from '../../lib/format'
import { supabase } from '../../lib/supabase'
import { appUrl } from '../../lib/routes'
import { useSettings } from '../../lib/SettingsContext'
import { btnPrimary, btnSecondary, inputCls, labelCls, smallInputCls } from '../../lib/ui'
import type { Customer, DiscountType, Invoice, InvoiceItem, InvoiceStatus, ItemType } from '../../lib/types'

const STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled']

function emptyItem(taxRate: number, position: number): InvoiceItem {
  return {
    position,
    item_type: 'service',
    description: '',
    details: '',
    quantity: 1,
    unit: '',
    unit_price: 0,
    tax_rate: taxRate,
  }
}

const emptyCustomer = {
  name: '',
  contact_name: '',
  email: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  postcode: '',
  country: 'United Kingdom',
  vat_number: '',
  notes: '',
}

export default function InvoiceEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { settings, refresh } = useSettings()

  const [inv, setInv] = useState<Invoice | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [view, setView] = useState<'edit' | 'preview'>('edit')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [nc, setNc] = useState({ ...emptyCustomer })

  useEffect(() => {
    if (!settings) return
    let cancelled = false
    async function init() {
      const s = settings!
      const { data: custs } = await supabase.from('customers').select('*').order('name')
      if (!cancelled && custs) setCustomers(custs as Customer[])
      if (id) {
        const { data: invoice } = await supabase.from('invoices').select('*').eq('id', id).single()
        const { data: lines } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', id)
          .order('position')
        if (!cancelled && invoice) {
          setInv(invoice as Invoice)
          setItems(
            lines && lines.length ? (lines as InvoiceItem[]) : [emptyItem(s.default_tax_rate, 0)],
          )
        }
      } else if (!cancelled) {
        setInv({
          invoice_number: `${s.invoice_prefix}${String(s.next_invoice_number).padStart(4, '0')}`,
          customer_id: null,
          status: 'draft',
          issue_date: today(),
          due_date: addDays(today(), s.payment_terms_days),
          currency: s.currency,
          discount_type: 'none',
          discount_value: 0,
          po_reference: '',
          payment_link: '',
          notes: s.invoice_notes,
          terms: `Payment is due within ${s.payment_terms_days} days of the invoice date.`,
          subtotal: 0,
          tax_total: 0,
          total: 0,
        })
        setItems([emptyItem(s.default_tax_rate, 0)])
      }
    }
    void init()
    return () => {
      cancelled = true
    }
  }, [settings, id])

  if (!settings || !inv) {
    return <div className="py-16 text-center text-sm text-[#4b4a44]">Loading invoice…</div>
  }

  const set = <K extends keyof Invoice>(k: K, v: Invoice[K]) =>
    setInv((p) => (p ? { ...p, [k]: v } : p))
  const setItem = (i: number, patch: Partial<InvoiceItem>) =>
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const moveItem = (i: number, dir: -1 | 1) =>
    setItems((arr) => {
      const j = i + dir
      if (j < 0 || j >= arr.length) return arr
      const copy = [...arr]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })
  const removeItem = (i: number) =>
    setItems((arr) => (arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr))

  const customer = customers.find((c) => c.id === inv.customer_id) ?? null
  const totals = computeTotals(items, inv.discount_type, inv.discount_value)
  const fm = (n: number) => formatMoney(n, inv.currency)

  function onIssueDateChange(date: string) {
    setInv((p) =>
      p ? { ...p, issue_date: date, due_date: addDays(date, settings!.payment_terms_days) } : p,
    )
  }

  async function save(): Promise<string | null> {
    if (!inv || !settings || saving) return null
    if (!inv.invoice_number.trim()) {
      setMessage('Invoice number is required')
      return null
    }
    setSaving(true)
    setMessage('')
    const record = {
      invoice_number: inv.invoice_number.trim(),
      customer_id: inv.customer_id,
      status: inv.status,
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      currency: inv.currency,
      discount_type: inv.discount_type,
      discount_value: inv.discount_value,
      po_reference: inv.po_reference,
      payment_link: inv.payment_link,
      notes: inv.notes,
      terms: inv.terms,
      subtotal: totals.subtotal,
      tax_total: totals.taxTotal,
      total: totals.total,
      updated_at: new Date().toISOString(),
    }

    let invId = inv.id
    if (!invId) {
      const { data, error } = await supabase.from('invoices').insert(record).select('id').single()
      if (error || !data) {
        setMessage(`Save failed: ${error?.message || 'unknown error'}`)
        setSaving(false)
        return null
      }
      invId = data.id as string
      await supabase
        .from('settings')
        .update({ next_invoice_number: settings.next_invoice_number + 1 })
        .eq('id', 1)
    } else {
      const { error } = await supabase.from('invoices').update(record).eq('id', invId)
      if (error) {
        setMessage(`Save failed: ${error.message}`)
        setSaving(false)
        return null
      }
      await supabase.from('invoice_items').delete().eq('invoice_id', invId)
    }

    const lines = items
      .filter((it) => it.description.trim() || it.unit_price !== 0)
      .map((it, i) => ({
        invoice_id: invId,
        position: i,
        item_type: it.item_type,
        description: it.description,
        details: it.details,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: it.unit_price,
        tax_rate: it.tax_rate,
      }))
    if (lines.length) {
      const { error } = await supabase.from('invoice_items').insert(lines)
      if (error) {
        setMessage(`Line items failed to save: ${error.message}`)
        setSaving(false)
        return null
      }
    }

    setSaving(false)
    setMessage('Saved.')
    if (!inv.id) {
      await refresh()
      navigate(`/apps/invoices/${invId}`, { replace: true })
    } else {
      setInv((p) => (p ? { ...p, subtotal: totals.subtotal, tax_total: totals.taxTotal, total: totals.total } : p))
    }
    return invId ?? null
  }

  // Saves, then opens a bare print page containing only the invoice document.
  // The blank tab is opened synchronously so popup blockers allow it.
  function printInvoice() {
    const w = window.open('', '_blank')
    void (async () => {
      const invId = await save()
      if (invId && w) {
        w.location.href = appUrl(`/apps/invoices/${invId}/print`)
      } else {
        w?.close()
      }
    })()
  }

  async function saveNewCustomer() {
    if (!nc.name.trim()) return
    const { data, error } = await supabase.from('customers').insert(nc).select('*').single()
    if (!error && data) {
      const created = data as Customer
      setCustomers((cs) => [...cs, created].sort((a, b) => a.name.localeCompare(b.name)))
      set('customer_id', created.id)
      setShowCustomerModal(false)
      setNc({ ...emptyCustomer })
    }
  }

  return (
    <div className="text-[13px]">
      {/* Toolbar */}
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/apps/invoices" className="link95">
            ← All invoices
          </Link>
          <b>{inv.id ? inv.invoice_number : 'New invoice'}</b>
          {message && <span className="text-[12px] text-[#4b4a44]">{message}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('edit')} className={`btn95 ${view === 'edit' ? 'pressed' : ''}`}>
            Edit
          </button>
          <button onClick={() => setView('preview')} className={`btn95 ${view === 'preview' ? 'pressed' : ''}`}>
            Preview
          </button>
          <button onClick={printInvoice} className={btnSecondary}>
            Print / PDF…
          </button>
          <button onClick={save} disabled={saving} className={btnPrimary}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {view === 'preview' ? (
        <InvoicePreview settings={settings} invoice={inv} items={items} customer={customer} />
      ) : (
        <div className="no-print grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            {/* Details */}
            <fieldset className="groupbox">
              <legend>Details</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className={labelCls}>Invoice number</span>
                  <input
                    className={inputCls}
                    value={inv.invoice_number}
                    onChange={(e) => set('invoice_number', e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Status</span>
                  <select
                    className={`${inputCls} capitalize`}
                    value={inv.status}
                    onChange={(e) => set('status', e.target.value as InvoiceStatus)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelCls}>Currency</span>
                  <select
                    className={inputCls}
                    value={inv.currency}
                    onChange={(e) => set('currency', e.target.value)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelCls}>Issue date</span>
                  <input
                    className={inputCls}
                    type="date"
                    value={inv.issue_date}
                    onChange={(e) => onIssueDateChange(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Due date</span>
                  <input
                    className={inputCls}
                    type="date"
                    value={inv.due_date}
                    onChange={(e) => set('due_date', e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>PO reference</span>
                  <input
                    className={inputCls}
                    value={inv.po_reference}
                    onChange={(e) => set('po_reference', e.target.value)}
                    placeholder="Optional"
                  />
                </label>
                <div className="col-span-2 sm:col-span-3">
                  <span className={labelCls}>Customer</span>
                  <div className="flex gap-2">
                    <select
                      className={inputCls}
                      value={inv.customer_id ?? ''}
                      onChange={(e) => set('customer_id', e.target.value || null)}
                    >
                      <option value="">— Select a customer —</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => setShowCustomerModal(true)} className={`${btnSecondary} shrink-0`}>
                      New…
                    </button>
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Line items */}
            <fieldset className="groupbox">
              <legend>Line items</legend>
              <div className="hidden gap-2 border-b border-[#9c9a92] pb-1.5 text-[11px] font-bold sm:grid sm:grid-cols-[86px_1fr_64px_110px_64px_84px_74px]">
                <div>Type</div>
                <div>Description</div>
                <div className="text-right">Qty / Hrs</div>
                <div className="text-right">Cost / Rate</div>
                <div className="text-right">VAT %</div>
                <div className="text-right">Amount</div>
                <div />
              </div>
              <div className="divide-y divide-[#c9c5bb]">
                {items.map((it, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-2 items-start gap-2 py-2.5 sm:grid-cols-[86px_1fr_64px_110px_64px_84px_74px]"
                  >
                    <select
                      className={`${smallInputCls} col-span-2 sm:col-span-1`}
                      value={it.item_type}
                      onChange={(e) => setItem(i, { item_type: e.target.value as ItemType })}
                      title="Product = qty × unit cost. Service = hours × hourly rate."
                    >
                      <option value="service">Service</option>
                      <option value="product">Product</option>
                    </select>
                    <div className="col-span-2 space-y-1.5 sm:col-span-1">
                      <input
                        className={smallInputCls}
                        placeholder={it.item_type === 'service' ? 'Service provided' : 'Product'}
                        value={it.description}
                        onChange={(e) => setItem(i, { description: e.target.value })}
                      />
                      <input
                        className={`${smallInputCls} !text-[12px]`}
                        placeholder="Extra details (optional)"
                        value={it.details}
                        onChange={(e) => setItem(i, { details: e.target.value })}
                      />
                    </div>
                    <input
                      className={`${smallInputCls} text-right`}
                      type="number"
                      min="0"
                      step="0.25"
                      value={it.quantity}
                      onChange={(e) => setItem(i, { quantity: Number(e.target.value) })}
                      title={it.item_type === 'service' ? 'Number of hours' : 'Quantity'}
                    />
                    <div className="flex items-center gap-1">
                      <input
                        className={`${smallInputCls} text-right`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.unit_price}
                        onChange={(e) => setItem(i, { unit_price: Number(e.target.value) })}
                        title={it.item_type === 'service' ? 'Hourly rate' : 'Unit cost'}
                      />
                      {it.item_type === 'service' && (
                        <span className="text-[11px] text-[#4b4a44]">/hr</span>
                      )}
                    </div>
                    <input
                      className={`${smallInputCls} text-right`}
                      type="number"
                      min="0"
                      step="0.5"
                      value={it.tax_rate}
                      onChange={(e) => setItem(i, { tax_rate: Number(e.target.value) })}
                    />
                    <div className="self-center text-right font-bold">
                      {fm(it.quantity * it.unit_price)}
                    </div>
                    <div className="flex items-center justify-end gap-1 self-center">
                      <button
                        onClick={() => moveItem(i, -1)}
                        disabled={i === 0}
                        className="btn95 h-6 w-6 !p-0 text-[11px] leading-none"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveItem(i, 1)}
                        disabled={i === items.length - 1}
                        className="btn95 h-6 w-6 !p-0 text-[11px] leading-none"
                        title="Move down"
                      >
                        ▼
                      </button>
                      <button
                        onClick={() => removeItem(i)}
                        disabled={items.length === 1}
                        className="btn95 h-6 w-6 !p-0 text-[12px] font-bold leading-none"
                        title="Remove line"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setItems((arr) => [...arr, emptyItem(settings.default_tax_rate, arr.length)])}
                className={`${btnSecondary} mt-2`}
              >
                Add line
              </button>
            </fieldset>

            {/* Notes */}
            <fieldset className="groupbox">
              <legend>Notes &amp; terms</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={labelCls}>Notes (visible on invoice)</span>
                  <textarea
                    className={inputCls}
                    rows={3}
                    value={inv.notes}
                    onChange={(e) => set('notes', e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Terms</span>
                  <textarea
                    className={inputCls}
                    rows={3}
                    value={inv.terms}
                    onChange={(e) => set('terms', e.target.value)}
                  />
                </label>
              </div>
            </fieldset>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <fieldset className="groupbox">
              <legend>Discount</legend>
              <div className="flex gap-2">
                <select
                  className={inputCls}
                  value={inv.discount_type}
                  onChange={(e) => set('discount_type', e.target.value as DiscountType)}
                >
                  <option value="none">No discount</option>
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed amount</option>
                </select>
                {inv.discount_type !== 'none' && (
                  <input
                    className="field95 w-20 text-right"
                    type="number"
                    min="0"
                    step="0.01"
                    value={inv.discount_value}
                    onChange={(e) => set('discount_value', Number(e.target.value))}
                  />
                )}
              </div>
            </fieldset>

            <fieldset className="groupbox">
              <legend>Payment</legend>
              <label className="block">
                <span className={labelCls}>Revolut payment link (this invoice)</span>
                <input
                  className={inputCls}
                  value={inv.payment_link}
                  onChange={(e) => set('payment_link', e.target.value)}
                  placeholder="Paste the link for this invoice"
                />
              </label>
              <p className="mt-2 text-[11px] leading-4 text-[#4b4a44]">
                Revolut generates a new link per payment request — paste this invoice's link here.
                Bank details from Settings are printed automatically.
              </p>
            </fieldset>

            <fieldset className="groupbox">
              <legend>Totals</legend>
              <div className="bevel-in space-y-1 px-3 py-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{fm(totals.subtotal)}</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span>−{fm(totals.discountAmount)}</span>
                  </div>
                )}
                {totals.taxBreakdown.map((t) => (
                  <div key={t.rate} className="flex justify-between">
                    <span>VAT @ {t.rate}%</span>
                    <span>{fm(t.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-[#9c9a92] pt-1 font-bold">
                  <span>Total</span>
                  <span>{fm(totals.total)}</span>
                </div>
              </div>
            </fieldset>
          </div>
        </div>
      )}

      {/* New customer dialog */}
      {showCustomerModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="win-frame w-full max-w-lg">
            <div className="titlebar flex items-center justify-between px-2 py-1.5">
              <span className="text-[13px] font-bold text-white">New customer</span>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="btn95 flex h-[22px] w-[24px] items-center justify-center !p-0 text-[14px] font-bold leading-none"
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Business / customer name *</span>
                  <input className={inputCls} value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} />
                </label>
                <label className="block">
                  <span className={labelCls}>Contact name</span>
                  <input className={inputCls} value={nc.contact_name} onChange={(e) => setNc({ ...nc, contact_name: e.target.value })} />
                </label>
                <label className="block">
                  <span className={labelCls}>Email</span>
                  <input className={inputCls} type="email" value={nc.email} onChange={(e) => setNc({ ...nc, email: e.target.value })} />
                </label>
                <label className="block">
                  <span className={labelCls}>Phone</span>
                  <input className={inputCls} value={nc.phone} onChange={(e) => setNc({ ...nc, phone: e.target.value })} />
                </label>
                <label className="block">
                  <span className={labelCls}>VAT number</span>
                  <input className={inputCls} value={nc.vat_number} onChange={(e) => setNc({ ...nc, vat_number: e.target.value })} />
                </label>
                <label className="block">
                  <span className={labelCls}>Address line 1</span>
                  <input className={inputCls} value={nc.address_line1} onChange={(e) => setNc({ ...nc, address_line1: e.target.value })} />
                </label>
                <label className="block">
                  <span className={labelCls}>Address line 2</span>
                  <input className={inputCls} value={nc.address_line2} onChange={(e) => setNc({ ...nc, address_line2: e.target.value })} />
                </label>
                <label className="block">
                  <span className={labelCls}>Town / City</span>
                  <input className={inputCls} value={nc.city} onChange={(e) => setNc({ ...nc, city: e.target.value })} />
                </label>
                <label className="block">
                  <span className={labelCls}>Postcode</span>
                  <input className={inputCls} value={nc.postcode} onChange={(e) => setNc({ ...nc, postcode: e.target.value })} />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Country</span>
                  <input className={inputCls} value={nc.country} onChange={(e) => setNc({ ...nc, country: e.target.value })} />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowCustomerModal(false)} className={btnSecondary}>
                  Cancel
                </button>
                <button onClick={saveNewCustomer} disabled={!nc.name.trim()} className={btnPrimary}>
                  Add customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
