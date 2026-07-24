import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate, formatMoney, today } from '../lib/format'
import type { Invoice } from '../lib/types'
import { BackBar, EmptyState, PageHeading, PortalCard, StatusPill } from './ui'

// Customers never see internal states like "draft" — just whether it needs paying.
function statusPill(inv: Invoice) {
  if (inv.status === 'paid') return <StatusPill text="Paid" tone="green" />
  if (inv.due_date < today()) return <StatusPill text="Please pay" tone="red" />
  return <StatusPill text="Due" tone="amber" />
}

export default function PortalInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .neq('status', 'cancelled')
        .order('issue_date', { ascending: false })
      setInvoices((data as Invoice[]) || [])
      setLoading(false)
    })()
  }, [])

  return (
    <div>
      <BackBar />
      <PageHeading emoji="📄">My Invoices</PageHeading>
      {loading ? (
        <p className="text-xl text-slate-500">Loading…</p>
      ) : invoices.length === 0 ? (
        <EmptyState emoji="🎉" title="You have no invoices" hint="Anything we send you will appear here." />
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => (
            <PortalCard key={inv.id} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Invoice {inv.invoice_number}
                </div>
                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {formatMoney(inv.total, inv.currency)}
                </div>
                <div className="mt-1 text-lg text-slate-500">Dated {formatDate(inv.issue_date)}</div>
              </div>
              <div className="flex items-center gap-4">
                {statusPill(inv)}
                <Link
                  to={`/invoices/${inv.id}`}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-lg font-bold text-white hover:bg-blue-700"
                >
                  View
                </Link>
              </div>
            </PortalCard>
          ))}
        </div>
      )}
    </div>
  )
}
