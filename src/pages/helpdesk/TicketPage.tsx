import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { formatDate } from '../../lib/format'
import { btnPrimary, inputCls } from '../../lib/ui'
import type { Customer, Ticket, TicketMessage, TicketPriority, TicketStatus } from '../../lib/types'

const STATUSES: TicketStatus[] = ['open', 'in_progress', 'waiting', 'resolved', 'closed']
const PRIORITIES: TicketPriority[] = ['low', 'normal', 'high', 'urgent']

export default function TicketPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [reply, setReply] = useState('')
  const [internal, setInternal] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    const { data: t } = await supabase.from('tickets').select('*').eq('id', id).single()
    if (!t) return
    setTicket(t as Ticket)
    const [{ data: msgs }, { data: cust }] = await Promise.all([
      supabase.from('ticket_messages').select('*').eq('ticket_id', id).order('created_at'),
      t.customer_id
        ? supabase.from('customers').select('*').eq('id', t.customer_id).single()
        : Promise.resolve({ data: null }),
    ])
    setMessages((msgs as TicketMessage[]) || [])
    setCustomer((cust as Customer) || null)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`ticket-staff-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${id}` },
        () => void load(),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [id, load])

  async function sendReply() {
    if (!reply.trim() || !ticket) return
    setBusy(true)
    await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id,
      author_id: profile?.id,
      author_role: 'staff',
      author_name: profile?.full_name || 'Support',
      body: reply.trim(),
      internal,
    })
    // A customer-facing reply nudges an open/waiting ticket into progress
    if (!internal && (ticket.status === 'open' || ticket.status === 'waiting')) {
      await supabase.from('tickets').update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', ticket.id)
    }
    setReply('')
    setBusy(false)
    await load()
  }

  async function deleteMessage(m: TicketMessage) {
    if (!window.confirm('Delete this message?')) return
    await supabase.from('ticket_messages').delete().eq('id', m.id)
    await load()
  }

  async function patchTicket(patch: Partial<Ticket>) {
    if (!ticket) return
    await supabase.from('tickets').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', ticket.id)
    await load()
  }

  if (!ticket) return <div className="p-6 text-center text-[#8a867a]">Loading…</div>

  return (
    <div className="text-[13px]">
      <button className="link95 mb-3 inline-block" onClick={() => navigate('/apps/helpdesk')}>
        ← All tickets
      </button>

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="space-y-3">
          <div className="bevel-in p-3">
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-bold text-blue-800">{ticket.ticket_number}</span>
              <span className="text-[15px] font-bold">{ticket.subject}</span>
            </div>
            <div className="mt-1 text-[12px] text-[#4b4a44]">
              {customer?.name || 'Unknown customer'} · opened {formatDate(ticket.created_at.slice(0, 10))}
            </div>
          </div>

          <div className="space-y-2">
            {messages.length === 0 && <div className="bevel-in p-3 text-[#8a867a]">No messages yet.</div>}
            {messages.map((m) => {
              const border = m.internal
                ? '!border-l-amber-500'
                : m.author_role === 'staff'
                  ? '!border-l-blue-500'
                  : '!border-l-green-500'
              return (
                <div key={m.id} className={`bevel-in border-l-4 p-3 ${border} ${m.internal ? 'bg-[#fff8e7]' : ''}`}>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-[#4b4a44]">
                    <span className="font-bold">
                      {m.author_name} {m.author_role === 'staff' ? '(you / team)' : '(customer)'}
                      {m.internal && <span className="ml-2 rounded bg-amber-200 px-1 text-amber-900">Internal note</span>}
                    </span>
                    <span className="flex items-center gap-2">
                      {new Date(m.created_at).toLocaleString('en-GB')}
                      <button className="link95 text-red-600" onClick={() => deleteMessage(m)} title="Delete message">
                        ✕
                      </button>
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">{m.body}</div>
                </div>
              )
            })}
          </div>

          <div className="bevel-in p-3">
            <textarea
              className={`${inputCls} w-full`}
              rows={4}
              placeholder={internal ? 'Write an internal note (only your team sees this)…' : 'Type your reply to the customer…'}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <div className="mt-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-[12px]">
                <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                Internal note (not shown to customer)
              </label>
              <button className={btnPrimary} onClick={sendReply} disabled={busy || !reply.trim()}>
                {busy ? 'Sending…' : internal ? 'Add note' : 'Send reply'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <fieldset className="groupbox">
            <legend>Status</legend>
            <div className="flex flex-col gap-1">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => patchTicket({ status: s })}
                  className={`btn95 !py-1 text-left capitalize ${ticket.status === s ? 'pressed' : ''}`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="groupbox">
            <legend>Priority</legend>
            <select
              className={inputCls}
              value={ticket.priority}
              onChange={(e) => patchTicket({ priority: e.target.value as TicketPriority })}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p} className="capitalize">
                  {p}
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset className="groupbox">
            <legend>Category</legend>
            <input
              className={inputCls}
              defaultValue={ticket.category}
              onBlur={(e) => {
                if (e.target.value !== ticket.category) patchTicket({ category: e.target.value })
              }}
              placeholder="e.g. Email, Printer…"
            />
          </fieldset>

          {customer && (
            <fieldset className="groupbox">
              <legend>Customer</legend>
              <div className="text-[12px] leading-5">
                <div className="font-bold">{customer.name}</div>
                {customer.email && <div>{customer.email}</div>}
                {customer.phone && <div>{customer.phone}</div>}
              </div>
            </fieldset>
          )}
        </div>
      </div>
    </div>
  )
}
