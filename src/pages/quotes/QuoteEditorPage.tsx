import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CURRENCIES, addDays, computeTotals, formatMoney, today } from '../../lib/format'
import { supabase } from '../../lib/supabase'
import { useSettings } from '../../lib/SettingsContext'
import { btnPrimary, btnSecondary, inputCls, labelCls, smallInputCls } from '../../lib/ui'
import type { Customer, DiscountType, ItemType, Quote, QuoteItem } from '../../lib/types'

function emptyItem(taxRate: number, position: number): QuoteItem {
  return { position, item_type: 'service', description: '', details: '', quantity: 1, unit: '', unit_price: 0, tax_rate: taxRate }
}

export default function QuoteEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { settings } = useSettings()
  const [q, setQ] = useState<Quote | null>(null)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!settings) return
    let cancelled = false
    void (async () => {
      const s = settings
      const { data: custs } = await supabase.from('customers').select('*').order('name')
      if (!cancelled && custs) setCustomers(custs as Customer[])
      if (id) {
        const { data: quote } = await supabase.from('quotes').select('*').eq('id', id).single()
        const { data: lines } = await supabase.from('quote_items').select('*').eq('quote_id', id).order('position')
        if (!cancelled && quote) {
          setQ(quote as Quote)
          setItems(lines && lines.length ? (lines as QuoteItem[]) : [emptyItem(s.default_tax_rate, 0)])
        }
      } else if (!cancelled) {
        setQ({
          quote_number: 'QUO-(new)',
          customer_id: null,
          status: 'draft',
          issue_date: today(),
          valid_until: addDays(today(), 30),
          currency: s.currency,
          discount_type: 'none',
          discount_value: 0,
          notes: s.invoice_notes,
          terms: 'This quote is valid for 30 days.',
          subtotal: 0,
          tax_total: 0,
          total: 0,
        })
        setItems([emptyItem(s.default_tax_rate, 0)])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [settings, id])

  if (!settings || !q) return <div className="p-6 text-center text-[#8a867a]">Loading…</div>

  const set = <K extends keyof Quote>(k: K, v: Quote[K]) => setQ((p) => (p ? { ...p, [k]: v } : p))
  const setItem = (i: number, patch: Partial<QuoteItem>) =>
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const totals = computeTotals(items, q.discount_type, q.discount_value)
  const fm = (n: number) => formatMoney(n, q.currency)

  async function save(sendNow = false): Promise<string | null> {
    if (saving || !q) return null
    setSaving(true)
    setMsg('')
    const record = {
      customer_id: q.customer_id,
      status: sendNow ? 'sent' : q.status,
      issue_date: q.issue_date,
      valid_until: q.valid_until,
      currency: q.currency,
      discount_type: q.discount_type,
      discount_value: q.discount_value,
      notes: q.notes,
      terms: q.terms,
      subtotal: totals.subtotal,
      tax_total: totals.taxTotal,
      total: totals.total,
      updated_at: new Date().toISOString(),
    }
    let quoteId = q.id
    if (!quoteId) {
      const { data, error } = await supabase.from('quotes').insert(record).select('id').single()
      if (error || !data) {
        setMsg(`Save failed: ${error?.message}`)
        setSaving(false)
        return null
      }
      quoteId = data.id
    } else {
      await supabase.from('quotes').update(record).eq('id', quoteId)
      await supabase.from('quote_items').delete().eq('quote_id', quoteId)
    }
    const lines = items
      .filter((it) => it.description.trim() || it.unit_price !== 0)
      .map((it, i) => ({
        quote_id: quoteId,
        position: i,
        item_type: it.item_type,
        description: it.description,
        details: it.details,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: it.unit_price,
        tax_rate: it.tax_rate,
      }))
    if (lines.length) await supabase.from('quote_items').insert(lines)
    setSaving(false)
    setMsg(sendNow ? 'Quote sent to customer.' : 'Saved.')
    if (!q.id) navigate(`/apps/quotes/${quoteId}`, { replace: true })
    else if (sendNow) set('status', 'sent')
    return quoteId ?? null
  }

  return (
    <div className="text-[13px]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <button className="link95" onClick={() => navigate('/apps/quotes')}>
          ← All quotes
        </button>
        <div className="flex items-center gap-2">
          {msg && <span className="text-[12px] text-[#4b4a44]">{msg}</span>}
          <button className={btnSecondary} onClick={() => void save(false)} disabled={saving}>
            Save draft
          </button>
          <button className={btnPrimary} onClick={() => void save(true)} disabled={saving}>
            Save &amp; send
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="space-y-4">
          <fieldset className="groupbox">
            <legend>Details</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label className="block">
                <span className={labelCls}>Customer</span>
                <select className={inputCls} value={q.customer_id ?? ''} onChange={(e) => set('customer_id', e.target.value || null)}>
                  <option value="">— Select —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelCls}>Currency</span>
                <select className={inputCls} value={q.currency} onChange={(e) => set('currency', e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelCls}>Issue date</span>
                <input className={inputCls} type="date" value={q.issue_date} onChange={(e) => set('issue_date', e.target.value)} />
              </label>
              <label className="block">
                <span className={labelCls}>Valid until</span>
                <input className={inputCls} type="date" value={q.valid_until} onChange={(e) => set('valid_until', e.target.value)} />
              </label>
            </div>
          </fieldset>

          <fieldset className="groupbox">
            <legend>Items</legend>
            <div className="hidden gap-2 border-b border-[#9c9a92] pb-1.5 text-[11px] font-bold sm:grid sm:grid-cols-[80px_1fr_60px_100px_60px_80px_30px]">
              <div>Type</div>
              <div>Description</div>
              <div className="text-right">Qty / Hrs</div>
              <div className="text-right">Cost / Rate</div>
              <div className="text-right">VAT %</div>
              <div className="text-right">Amount</div>
              <div />
            </div>
            <div className="space-y-2 pt-2">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-2 items-start gap-2 sm:grid-cols-[80px_1fr_60px_100px_60px_80px_30px]">
                  <select className={smallInputCls} value={it.item_type} onChange={(e) => setItem(i, { item_type: e.target.value as ItemType })}>
                    <option value="service">Service</option>
                    <option value="product">Product</option>
                  </select>
                  <input className={smallInputCls} placeholder="Description" value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} />
                  <input className={`${smallInputCls} text-right`} type="number" min="0" step="0.25" value={it.quantity} onChange={(e) => setItem(i, { quantity: Number(e.target.value) })} title={it.item_type === 'service' ? 'Hours' : 'Qty'} />
                  <input className={`${smallInputCls} text-right`} type="number" min="0" step="0.01" value={it.unit_price} onChange={(e) => setItem(i, { unit_price: Number(e.target.value) })} title={it.item_type === 'service' ? 'Hourly rate' : 'Unit cost'} />
                  <input className={`${smallInputCls} text-right`} type="number" min="0" step="0.5" value={it.tax_rate} onChange={(e) => setItem(i, { tax_rate: Number(e.target.value) })} title="VAT %" />
                  <div className="self-center text-right font-medium">{fm(it.quantity * it.unit_price)}</div>
                  <button className="btn95 self-center !px-2 !py-0.5" onClick={() => setItems((a) => (a.length > 1 ? a.filter((_, idx) => idx !== i) : a))} title="Remove">
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button className={`${btnSecondary} mt-2`} onClick={() => setItems((a) => [...a, emptyItem(settings.default_tax_rate, a.length)])}>
              + Add line
            </button>
          </fieldset>

          <fieldset className="groupbox">
            <legend>Notes &amp; terms</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={labelCls}>Notes</span>
                <textarea className={inputCls} rows={3} value={q.notes} onChange={(e) => set('notes', e.target.value)} />
              </label>
              <label className="block">
                <span className={labelCls}>Terms</span>
                <textarea className={inputCls} rows={3} value={q.terms} onChange={(e) => set('terms', e.target.value)} />
              </label>
            </div>
          </fieldset>
        </div>

        <div className="space-y-4">
          <fieldset className="groupbox">
            <legend>Discount</legend>
            <div className="flex gap-2">
              <select className={inputCls} value={q.discount_type} onChange={(e) => set('discount_type', e.target.value as DiscountType)}>
                <option value="none">None</option>
                <option value="percent">Percent</option>
                <option value="fixed">Fixed</option>
              </select>
              {q.discount_type !== 'none' && (
                <input className={`${inputCls} w-20 text-right`} type="number" value={q.discount_value} onChange={(e) => set('discount_value', Number(e.target.value))} />
              )}
            </div>
          </fieldset>
          <fieldset className="groupbox">
            <legend>Totals</legend>
            <div className="space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>{fm(totals.subtotal)}</span></div>
              {totals.discountAmount > 0 && <div className="flex justify-between"><span>Discount</span><span>−{fm(totals.discountAmount)}</span></div>}
              {totals.taxBreakdown.map((t) => (
                <div key={t.rate} className="flex justify-between"><span>VAT @ {t.rate}%</span><span>{fm(t.amount)}</span></div>
              ))}
              <div className="mt-1 flex justify-between border-t border-[#9c9a92] pt-1 font-bold"><span>Total</span><span>{fm(totals.total)}</span></div>
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  )
}
