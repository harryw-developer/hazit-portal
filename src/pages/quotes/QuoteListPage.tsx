import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { addDays, formatDate, formatMoney, today } from '../../lib/format'
import { btnPrimary, btnSecondary } from '../../lib/ui'
import type { Quote, QuoteItem, QuoteStatus } from '../../lib/types'

type Row = Quote & { customer: { name: string } | null }

const STATUS_COLOR: Record<QuoteStatus, string> = {
  draft: 'bg-gray-200 text-gray-700',
  sent: 'bg-sky-100 text-sky-800',
  approved: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-700',
  expired: 'bg-amber-100 text-amber-800',
  converted: 'bg-indigo-100 text-indigo-800',
}

export default function QuoteListPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('quotes')
      .select('*, customer:customers(name)')
      .order('created_at', { ascending: false })
    setRows((data as Row[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function convertToInvoice(q: Row) {
    if (busy) return
    if (!window.confirm(`Create an invoice from ${q.quote_number}?`)) return
    setBusy(true)
    const { data: s } = await supabase.from('settings').select('*').eq('id', 1).single()
    const { data: items } = await supabase.from('quote_items').select('*').eq('quote_id', q.id).order('position')
    if (!s) {
      setBusy(false)
      return
    }
    const number = `${s.invoice_prefix}${String(s.next_invoice_number).padStart(4, '0')}`
    const { data: inv } = await supabase
      .from('invoices')
      .insert({
        invoice_number: number,
        customer_id: q.customer_id,
        status: 'draft',
        issue_date: today(),
        due_date: addDays(today(), s.payment_terms_days),
        currency: q.currency,
        discount_type: q.discount_type,
        discount_value: q.discount_value,
        notes: q.notes,
        terms: q.terms,
        subtotal: q.subtotal,
        tax_total: q.tax_total,
        total: q.total,
      })
      .select('id')
      .single()
    if (inv) {
      if (items && items.length) {
        await supabase.from('invoice_items').insert(
          (items as QuoteItem[]).map((it, i) => ({
            invoice_id: inv.id,
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
      await supabase.from('settings').update({ next_invoice_number: s.next_invoice_number + 1 }).eq('id', 1)
      await supabase.from('quotes').update({ status: 'converted', converted_invoice_id: inv.id }).eq('id', q.id)
      setBusy(false)
      navigate(`/apps/invoices/${inv.id}`)
      return
    }
    setBusy(false)
    await load()
  }

  async function removeQuote(q: Row) {
    if (!window.confirm(`Delete quote ${q.quote_number}? This cannot be undone.`)) return
    await supabase.from('quotes').delete().eq('id', q.id)
    await load()
  }

  async function clearOld() {
    const stale = rows.filter((q) => ['declined', 'expired', 'converted'].includes(q.status))
    if (stale.length === 0) {
      window.alert('There are no old quotes to clear (declined, expired or already-invoiced).')
      return
    }
    if (!window.confirm(`Delete ${stale.length} old quote(s) — declined, expired and already-invoiced? This cannot be undone.`)) return
    await supabase.from('quotes').delete().in('id', stale.map((q) => q.id!))
    await load()
  }

  return (
    <div className="text-[13px]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-[#4b4a44]">
          Send estimates; customers approve or decline from their portal. Approved quotes convert to invoices.
        </p>
        <div className="flex gap-2">
          <button className={btnSecondary} onClick={clearOld}>
            Clear old quotes
          </button>
          <button className={btnPrimary} onClick={() => navigate('/apps/quotes/new')}>
            New quote…
          </button>
        </div>
      </div>

      <div className="bevel-in overflow-x-auto">
        <table className="tbl95 w-full min-w-[760px]">
          <thead>
            <tr>
              <th>Quote</th>
              <th>Customer</th>
              <th>Issued</th>
              <th>Valid until</th>
              <th className="text-right">Total</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="!p-6 text-center text-[#8a867a]">Loading…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="!p-6 text-center text-[#8a867a]">No quotes yet.</td>
              </tr>
            ) : (
              rows.map((q) => (
                <tr key={q.id} className="bg-white">
                  <td>
                    <button className="link95 font-mono font-bold" onClick={() => navigate(`/apps/quotes/${q.id}`)}>
                      {q.quote_number}
                    </button>
                  </td>
                  <td>{q.customer?.name || '—'}</td>
                  <td className="whitespace-nowrap">{formatDate(q.issue_date)}</td>
                  <td className="whitespace-nowrap">{formatDate(q.valid_until)}</td>
                  <td className="text-right font-bold">{formatMoney(q.total, q.currency)}</td>
                  <td>
                    <span className={`rounded px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_COLOR[q.status]}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-right">
                    {q.status === 'approved' && (
                      <button className="link95 mr-3 text-green-700" onClick={() => convertToInvoice(q)} disabled={busy}>
                        → Invoice
                      </button>
                    )}
                    <button className="link95 mr-3" onClick={() => navigate(`/apps/quotes/${q.id}`)}>
                      Open
                    </button>
                    <button className="link95 text-red-600" onClick={() => removeQuote(q)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
