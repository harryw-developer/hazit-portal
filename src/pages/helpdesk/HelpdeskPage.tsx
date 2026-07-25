import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { formatDate, today } from '../../lib/format'
import { btnPrimary, btnSecondary, inputCls, labelCls } from '../../lib/ui'
import type { Customer, Ticket, TicketPriority, TicketStatus } from '../../lib/types'

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

const STATUS_FILTERS: ('all' | TicketStatus)[] = ['all', 'open', 'in_progress', 'waiting', 'resolved', 'closed']
const PRIORITY_FILTERS: ('all' | TicketPriority)[] = ['all', 'urgent', 'high', 'normal', 'low']

export default function HelpdeskPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('all')
  const [priority, setPriority] = useState<(typeof PRIORITY_FILTERS)[number]>('all')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    const [{ data }, { data: cs }] = await Promise.all([
      supabase.from('tickets').select('*, customer:customers(name)').order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('name'),
    ])
    setRows((data as Row[]) || [])
    setCustomers((cs as Customer[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const stats = useMemo(() => {
    const open = rows.filter((r) => r.status === 'open').length
    const active = rows.filter((r) => r.status === 'in_progress' || r.status === 'waiting').length
    const urgent = rows.filter((r) => r.priority === 'urgent' && r.status !== 'closed' && r.status !== 'resolved').length
    const resolved = rows.filter((r) => r.status === 'resolved' || r.status === 'closed').length
    return [
      { label: 'New / open', value: open },
      { label: 'In progress', value: active },
      { label: 'Urgent', value: urgent, alert: urgent > 0 },
      { label: 'Resolved', value: resolved },
    ]
  }, [rows])

  const visible = rows.filter((r) => {
    if (status !== 'all' && r.status !== status) return false
    if (priority !== 'all' && r.priority !== priority) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      r.ticket_number.toLowerCase().includes(q) ||
      r.subject.toLowerCase().includes(q) ||
      (r.customer?.name || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="text-[13px]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-[#4b4a44]">
          Customers raise tickets from their portal (including live chat); you can also log one here.
        </p>
        <button className={btnPrimary} onClick={() => setCreating(true)}>
          Log a ticket…
        </button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bevel-in px-3 py-2">
            <div className="text-[11px] text-[#4b4a44]">{s.label}</div>
            <div className={`text-[18px] font-bold ${s.alert ? 'text-red-600' : ''}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-1">
        {STATUS_FILTERS.map((f) => (
          <button key={f} onClick={() => setStatus(f)} className={`btn95 !py-1 text-[12px] capitalize ${status === f ? 'pressed' : ''}`}>
            {f === 'all' ? 'All' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-[#4b4a44]">Priority:</span>
        {PRIORITY_FILTERS.map((f) => (
          <button key={f} onClick={() => setPriority(f)} className={`btn95 !py-0.5 text-[12px] capitalize ${priority === f ? 'pressed' : ''}`}>
            {f}
          </button>
        ))}
        <div className="flex-1" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ref, subject, customer…"
          className={`${inputCls} w-56`}
        />
      </div>

      <div className="bevel-in overflow-x-auto">
        <table className="tbl95 w-full min-w-[820px]">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Customer</th>
              <th>Subject</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="!p-6 text-center text-[#8a867a]">Loading…</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={7} className="!p-6 text-center text-[#8a867a]">No tickets match.</td></tr>
            ) : (
              visible.map((t) => (
                <tr key={t.id} className="cursor-pointer bg-white hover:bg-[#eef3fb]" onClick={() => navigate(`/apps/helpdesk/${t.id}`)}>
                  <td className="font-mono font-bold text-blue-800">{t.ticket_number}</td>
                  <td>{t.customer?.name || '—'}</td>
                  <td>{t.subject}</td>
                  <td className="text-[#4b4a44]">{t.category || '—'}</td>
                  <td className={`capitalize ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</td>
                  <td>
                    <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLOR[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-[#4b4a44]">{formatDate(t.updated_at.slice(0, 10))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <NewTicket
          customers={customers}
          staffId={profile?.id}
          staffName={profile?.full_name || 'Support'}
          onClose={() => setCreating(false)}
          onCreated={(id) => navigate(`/apps/helpdesk/${id}`)}
        />
      )}
    </div>
  )
}

function NewTicket({
  customers,
  staffId,
  staffName,
  onClose,
  onCreated,
}: {
  customers: Customer[]
  staffId?: string
  staffName: string
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const [customerId, setCustomerId] = useState('')
  const [subject, setSubject] = useState('')
  const [prio, setPrio] = useState<TicketPriority>('normal')
  const [category, setCategory] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  async function create() {
    if (!subject.trim()) return
    setBusy(true)
    const { data: t } = await supabase
      .from('tickets')
      .insert({
        customer_id: customerId || null,
        subject: subject.trim(),
        priority: prio,
        category: category.trim(),
        status: 'open',
        created_by: staffId,
      })
      .select('id')
      .single()
    if (t && body.trim()) {
      await supabase.from('ticket_messages').insert({
        ticket_id: t.id,
        author_id: staffId,
        author_role: 'staff',
        author_name: staffName,
        body: body.trim(),
      })
    }
    setBusy(false)
    if (t) onCreated(t.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="win-frame my-8 w-full max-w-lg">
        <div className="titlebar flex items-center justify-between px-2 py-1.5">
          <span className="text-[13px] font-bold text-white">Log a ticket</span>
          <button className="btn95 flex h-[22px] w-[24px] items-center justify-center !p-0 font-bold" onClick={onClose}>×</button>
        </div>
        <div className="space-y-3 p-4 text-[13px]">
          <label className="block">
            <span className={labelCls}>Customer</span>
            <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">— None / general —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Subject *</span>
            <input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelCls}>Priority</span>
              <select className={inputCls} value={prio} onChange={(e) => setPrio(e.target.value as TicketPriority)}>
                {(['low', 'normal', 'high', 'urgent'] as TicketPriority[]).map((p) => (
                  <option key={p} value={p} className="capitalize">{p}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Category</span>
              <input className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Email, Printer…" />
            </label>
          </div>
          <label className="block">
            <span className={labelCls}>First note / description</span>
            <textarea className={inputCls} rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder={`Logged ${formatDate(today())}…`} />
          </label>
          <div className="flex justify-end gap-2">
            <button className={btnSecondary} onClick={onClose}>Cancel</button>
            <button className={btnPrimary} onClick={create} disabled={busy || !subject.trim()}>
              {busy ? 'Creating…' : 'Create ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
