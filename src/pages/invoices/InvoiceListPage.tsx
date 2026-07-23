import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addDays, formatDate, formatMoney, today } from '../../lib/format'
import { supabase } from '../../lib/supabase'
import { useSettings } from '../../lib/SettingsContext'
import { btnPrimary } from '../../lib/ui'
import type { Invoice, InvoiceItem, InvoiceStatus } from '../../lib/types'

type Row = Invoice & { customer: { name: string } | null }

const statusText: Record<InvoiceStatus, string> = {
  draft: 'text-[#5a5750]',
  sent: 'text-[#1d4ed8]',
  paid: 'text-[#15803d] font-bold',
  overdue: 'text-[#b91c1c] font-bold',
  cancelled: 'text-[#8a867a] line-through',
}

const FILTERS: ('all' | InvoiceStatus)[] = ['all', 'draft', 'sent', 'overdue', 'paid', 'cancelled']

// A "sent" invoice past its due date shows as overdue without changing stored status
function effectiveStatus(inv: Row): InvoiceStatus {
  if (inv.status === 'sent' && inv.due_date < today()) return 'overdue'
  return inv.status
}

export default function InvoiceListPage() {
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('invoices')
      .select('*, customer:customers(name)')
      .order('created_at', { ascending: false })
    setRows((data as Row[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const summary = useMemo(() => {
    const currency = settings?.currency || 'GBP'
    let outstanding = 0
    let overdue = 0
    let paid = 0
    let drafts = 0
    for (const r of rows) {
      const s = effectiveStatus(r)
      if (s === 'sent' || s === 'overdue') outstanding += r.total
      if (s === 'overdue') overdue += r.total
      if (s === 'paid') paid += r.total
      if (s === 'draft') drafts += 1
    }
    return { currency, outstanding, overdue, paid, drafts }
  }, [rows, settings])

  const visible = rows.filter((r) => {
    if (filter !== 'all' && effectiveStatus(r) !== filter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      r.invoice_number.toLowerCase().includes(q) ||
      (r.customer?.name || '').toLowerCase().includes(q)
    )
  })

  async function markPaid(r: Row) {
    await supabase.from('invoices').update({ status: 'paid' }).eq('id', r.id)
    await load()
  }

  async function remove(r: Row) {
    if (!window.confirm(`Delete invoice ${r.invoice_number}? This cannot be undone.`)) return
    await supabase.from('invoices').delete().eq('id', r.id)
    await load()
  }

  async function duplicate(r: Row) {
    if (busy) return
    setBusy(true)
    const { data: s } = await supabase.from('settings').select('*').eq('id', 1).single()
    if (!s) {
      setBusy(false)
      return
    }
    const number = `${s.invoice_prefix}${String(s.next_invoice_number).padStart(4, '0')}`
    const { data: created, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: number,
        customer_id: r.customer_id,
        status: 'draft',
        issue_date: today(),
        due_date: addDays(today(), s.payment_terms_days),
        currency: r.currency,
        discount_type: r.discount_type,
        discount_value: r.discount_value,
        po_reference: r.po_reference,
        payment_link: '',
        notes: r.notes,
        terms: r.terms,
        subtotal: r.subtotal,
        tax_total: r.tax_total,
        total: r.total,
      })
      .select('id')
      .single()
    if (!error && created) {
      const { data: lines } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', r.id)
        .order('position')
      if (lines && lines.length) {
        await supabase.from('invoice_items').insert(
          (lines as InvoiceItem[]).map((it, i) => ({
            invoice_id: created.id,
            position: i,
            item_type: it.item_type,
            description: it.description,
            details: it.details,
            quantity: it.quantity,
            unit: it.unit,
            unit_price: it.unit_price,
            tax_rate: it.tax_rate,
          })),
        )
      }
      await supabase
        .from('settings')
        .update({ next_invoice_number: s.next_invoice_number + 1 })
        .eq('id', 1)
      setBusy(false)
      navigate(`/apps/invoices/${created.id}`)
      return
    }
    setBusy(false)
    await load()
  }

  const fm = (n: number) => formatMoney(n, summary.currency)

  return (
    <div className="space-y-3 text-[13px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="bevel-in px-3 py-1.5 text-[12px]">
          Outstanding: <b>{fm(summary.outstanding)}</b>
          {' · '}Overdue: <b className={summary.overdue > 0 ? 'text-[#b91c1c]' : ''}>{fm(summary.overdue)}</b>
          {' · '}Paid: <b>{fm(summary.paid)}</b>
          {' · '}Drafts: <b>{summary.drafts}</b>
        </div>
        <Link to="/apps/invoices/new" className={btnPrimary}>
          New invoice…
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn95 !px-2.5 !py-1 !text-[12px] capitalize ${filter === f ? 'pressed' : ''}`}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search number or customer…"
          className="field95 w-56"
        />
      </div>

      <div className="bevel-in overflow-x-auto p-0.5">
        <table className="tbl95 w-full min-w-[720px]">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Issued</th>
              <th>Due</th>
              <th className="!text-right">Total</th>
              <th>Status</th>
              <th className="!text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#8a867a]">
                  Loading invoices…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#8a867a]">
                  {rows.length === 0
                    ? 'No invoices yet — create your first one.'
                    : 'No invoices match this filter.'}
                </td>
              </tr>
            ) : (
              visible.map((r) => {
                const s = effectiveStatus(r)
                return (
                  <tr key={r.id} className="hover:bg-[#f4f2ea]">
                    <td>
                      <Link to={`/apps/invoices/${r.id}`} className="link95 font-bold">
                        {r.invoice_number}
                      </Link>
                    </td>
                    <td>{r.customer?.name || '—'}</td>
                    <td>{formatDate(r.issue_date)}</td>
                    <td>{formatDate(r.due_date)}</td>
                    <td className="!text-right font-bold">{formatMoney(r.total, r.currency)}</td>
                    <td className={`capitalize ${statusText[s]}`}>{s}</td>
                    <td className="whitespace-nowrap !text-right text-[12px]">
                      {s !== 'paid' && s !== 'cancelled' && (
                        <button onClick={() => markPaid(r)} className="link95 mr-2">
                          Mark paid
                        </button>
                      )}
                      <button onClick={() => duplicate(r)} disabled={busy} className="link95 mr-2">
                        Duplicate
                      </button>
                      <button onClick={() => remove(r)} className="link95 text-[#b91c1c]">
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
