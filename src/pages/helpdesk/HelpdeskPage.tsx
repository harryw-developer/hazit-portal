import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'
import type { Ticket, TicketStatus } from '../../lib/types'

type Row = Ticket & { customer: { name: string } | null }

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  waiting: 'Waiting on customer',
  resolved: 'Resolved',
  closed: 'Closed',
}
const STATUS_COLOR: Record<TicketStatus, string> = {
  open: 'bg-sky-100 text-sky-800',
  in_progress: 'bg-amber-100 text-amber-800',
  waiting: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-200 text-gray-600',
}
const PRIORITY_COLOR: Record<string, string> = {
  low: 'text-gray-500',
  normal: 'text-gray-700',
  high: 'text-orange-600 font-bold',
  urgent: 'text-red-600 font-bold',
}

const FILTERS: ('all' | TicketStatus)[] = ['all', 'open', 'in_progress', 'waiting', 'resolved', 'closed']

export default function HelpdeskPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('tickets')
      .select('*, customer:customers(name)')
      .order('created_at', { ascending: false })
    setRows((data as Row[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = rows.filter((r) => filter === 'all' || r.status === filter)
  const openCount = rows.filter((r) => r.status !== 'closed' && r.status !== 'resolved').length

  return (
    <div className="text-[13px]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-[#4b4a44]">
          {openCount} active {openCount === 1 ? 'ticket' : 'tickets'}. Customers raise these from their
          portal; you can also log one on their behalf.
        </p>
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn95 !py-1 text-[12px] capitalize ${filter === f ? 'pressed' : ''}`}
          >
            {f === 'all' ? 'All' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="bevel-in overflow-x-auto">
        <table className="tbl95 w-full min-w-[760px]">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Customer</th>
              <th>Subject</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Raised</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="!p-6 text-center text-[#8a867a]">
                  Loading…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="!p-6 text-center text-[#8a867a]">
                  No tickets here.
                </td>
              </tr>
            ) : (
              visible.map((t) => (
                <tr
                  key={t.id}
                  className="cursor-pointer bg-white hover:bg-[#eef3fb]"
                  onClick={() => navigate(`/apps/helpdesk/${t.id}`)}
                >
                  <td className="font-mono font-bold text-blue-800">{t.ticket_number}</td>
                  <td>{t.customer?.name || '—'}</td>
                  <td>{t.subject}</td>
                  <td className={PRIORITY_COLOR[t.priority]}>{t.priority}</td>
                  <td>
                    <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLOR[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-[#4b4a44]">{formatDate(t.created_at.slice(0, 10))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
