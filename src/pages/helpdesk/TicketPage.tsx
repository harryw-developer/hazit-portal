import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { btnPrimary, btnSecondary, inputCls } from '../../lib/ui'
import type { Customer, Ticket, TicketMessage, TicketStatus } from '../../lib/types'

const STATUSES: TicketStatus[] = ['open', 'in_progress', 'waiting', 'resolved', 'closed']

export default function TicketPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [reply, setReply] = useState('')
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

  // Live updates (e.g. live-chat messages from the customer)
  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`ticket-staff-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${id}` },
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
    })
    // Replying moves an open/waiting ticket into progress
    if (ticket.status === 'open' || ticket.status === 'waiting') {
      await supabase.from('tickets').update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', ticket.id)
    }
    setReply('')
    setBusy(false)
    await load()
  }

  async function setStatus(status: TicketStatus) {
    if (!ticket) return
    await supabase.from('tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', ticket.id)
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
              {customer?.name || 'Unknown customer'}
              {ticket.category ? ` · ${ticket.category}` : ''} · priority {ticket.priority}
            </div>
          </div>

          <div className="space-y-2">
            {messages.length === 0 && (
              <div className="bevel-in p-3 text-[#8a867a]">No messages yet.</div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`bevel-in p-3 ${m.author_role === 'staff' ? 'border-l-4 !border-l-blue-500' : 'border-l-4 !border-l-green-500'}`}
              >
                <div className="mb-1 flex justify-between text-[11px] text-[#4b4a44]">
                  <span className="font-bold">
                    {m.author_name} {m.author_role === 'staff' ? '(you / team)' : '(customer)'}
                  </span>
                  <span>{new Date(m.created_at).toLocaleString('en-GB')}</span>
                </div>
                <div className="whitespace-pre-wrap">{m.body}</div>
              </div>
            ))}
          </div>

          <div className="bevel-in p-3">
            <textarea
              className={`${inputCls} w-full`}
              rows={4}
              placeholder="Type your reply to the customer…"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <div className="mt-2 flex justify-end">
              <button className={btnPrimary} onClick={sendReply} disabled={busy || !reply.trim()}>
                {busy ? 'Sending…' : 'Send reply'}
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
                  onClick={() => setStatus(s)}
                  className={`btn95 !py-1 text-left capitalize ${ticket.status === s ? 'pressed' : ''}`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </fieldset>
          {customer && (
            <fieldset className="groupbox">
              <legend>Customer</legend>
              <div className="text-[12px] leading-5">
                <div className="font-bold">{customer.name}</div>
                {customer.email && <div>{customer.email}</div>}
                {customer.phone && <div>{customer.phone}</div>}
              </div>
              <button className={`${btnSecondary} mt-2 w-full`} onClick={() => navigate('/apps/customers')}>
                Open in Customers
              </button>
            </fieldset>
          )}
        </div>
      </div>
    </div>
  )
}
