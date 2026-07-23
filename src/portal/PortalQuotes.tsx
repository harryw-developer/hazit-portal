import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate, formatMoney } from '../lib/format'
import type { Quote, QuoteItem, QuoteStatus } from '../lib/types'
import { BackBar, BigButton, EmptyState, PageHeading, PortalCard, StatusPill } from './ui'

const PILL: Record<QuoteStatus, { text: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'gray' }> = {
  draft: { text: 'Draft', tone: 'gray' },
  sent: { text: 'Awaiting your decision', tone: 'amber' },
  approved: { text: 'Approved', tone: 'green' },
  declined: { text: 'Declined', tone: 'red' },
  expired: { text: 'Expired', tone: 'gray' },
  converted: { text: 'Approved', tone: 'green' },
}

export default function PortalQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [items, setItems] = useState<Record<string, QuoteItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('quotes')
      .select('*')
      .neq('status', 'draft')
      .order('issue_date', { ascending: false })
    const qs = (data as Quote[]) || []
    setQuotes(qs)
    if (qs.length) {
      const { data: its } = await supabase
        .from('quote_items')
        .select('*')
        .in('quote_id', qs.map((q) => q.id!))
        .order('position')
      const grouped: Record<string, QuoteItem[]> = {}
      for (const it of (its as QuoteItem[]) || []) {
        ;(grouped[it.quote_id!] ||= []).push(it)
      }
      setItems(grouped)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function respond(q: Quote, approve: boolean) {
    if (!q.id) return
    if (!approve && !window.confirm('Are you sure you want to decline this quote?')) return
    setBusy(q.id)
    await supabase.rpc('respond_to_quote', { p_quote_id: q.id, p_approve: approve })
    setBusy('')
    await load()
  }

  return (
    <div>
      <BackBar />
      <PageHeading emoji="🧾">My Quotes</PageHeading>
      <p className="mb-6 text-lg text-slate-600">
        Prices we've prepared for you. When you're happy, tap <b>Approve</b> and we'll get started.
      </p>

      {loading ? (
        <p className="text-xl text-slate-500">Loading…</p>
      ) : quotes.length === 0 ? (
        <EmptyState emoji="🧾" title="No quotes right now" hint="Anything we prepare for you will appear here." />
      ) : (
        <div className="space-y-5">
          {quotes.map((q) => {
            const p = PILL[q.status]
            return (
              <PortalCard key={q.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      Quote {q.quote_number}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-slate-900">
                      {formatMoney(q.total, q.currency)}
                    </div>
                    <div className="mt-1 text-lg text-slate-500">Valid until {formatDate(q.valid_until)}</div>
                  </div>
                  <StatusPill text={p.text} tone={p.tone} />
                </div>

                {(items[q.id!] || []).length > 0 && (
                  <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                    {(items[q.id!] || []).map((it, i) => (
                      <li key={i} className="flex justify-between gap-4 py-2 text-lg">
                        <span className="text-slate-700">{it.description}</span>
                        <span className="font-medium text-slate-900">
                          {formatMoney(it.quantity * it.unit_price, q.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {q.notes && <p className="mt-3 text-lg text-slate-600">{q.notes}</p>}

                {q.status === 'sent' && (
                  <div className="mt-5 flex flex-wrap justify-end gap-3">
                    <BigButton variant="secondary" onClick={() => respond(q, false)} disabled={busy === q.id}>
                      Decline
                    </BigButton>
                    <BigButton variant="success" onClick={() => respond(q, true)} disabled={busy === q.id}>
                      {busy === q.id ? 'Saving…' : '✅ Approve this quote'}
                    </BigButton>
                  </div>
                )}
              </PortalCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
