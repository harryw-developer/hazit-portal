import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/format'
import type { Ticket, TicketStatus } from '../lib/types'
import { BackBar, BigButton, EmptyState, PageHeading, PortalCard, StatusPill } from './ui'

const PILL: Record<TicketStatus, { text: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'gray' }> = {
  open: { text: 'Received', tone: 'blue' },
  in_progress: { text: 'Being worked on', tone: 'amber' },
  waiting: { text: 'Waiting for you', tone: 'red' },
  resolved: { text: 'Resolved', tone: 'green' },
  closed: { text: 'Closed', tone: 'gray' },
}

export default function PortalTickets() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from('tickets').select('*').order('updated_at', { ascending: false })
      setTickets((data as Ticket[]) || [])
      setLoading(false)
    })()
  }, [])

  return (
    <div>
      <BackBar />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <PageHeading emoji="💬">Get Help</PageHeading>
        <BigButton onClick={() => navigate('/help/new')}>✏️ Ask for help</BigButton>
      </div>

      {loading ? (
        <p className="text-xl text-slate-500">Loading…</p>
      ) : tickets.length === 0 ? (
        <EmptyState
          emoji="💬"
          title="No questions yet"
          hint="Tap ‘Ask for help’ above whenever you need us."
        />
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => {
            const p = PILL[t.status]
            return (
              <Link key={t.id} to={`/help/${t.id}`} className="block">
                <PortalCard className="flex flex-wrap items-center justify-between gap-4 hover:border-blue-400">
                  <div>
                    <div className="text-xl font-bold text-slate-900">{t.subject}</div>
                    <div className="mt-1 text-lg text-slate-500">
                      {t.ticket_number} · {formatDate(t.created_at.slice(0, 10))}
                    </div>
                  </div>
                  <StatusPill text={p.text} tone={p.tone} />
                </PortalCard>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
