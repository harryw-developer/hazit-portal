import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { Ticket, TicketMessage } from '../lib/types'
import { BackBar, BigButton, PortalCard } from './ui'

export default function PortalTicketView() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    const { data: t } = await supabase.from('tickets').select('*').eq('id', id).single()
    const { data: msgs } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at')
    setTicket((t as Ticket) || null)
    setMessages((msgs as TicketMessage[]) || [])
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  // Live updates so staff replies appear without refreshing
  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`ticket-cust-${id}`)
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

  async function send() {
    if (!reply.trim() || !ticket) return
    setBusy(true)
    await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id,
      author_id: profile?.id,
      author_role: 'customer',
      author_name: profile?.full_name || 'Customer',
      body: reply.trim(),
    })
    await supabase.from('tickets').update({ status: 'open', updated_at: new Date().toISOString() }).eq('id', ticket.id)
    setReply('')
    setBusy(false)
    await load()
  }

  async function deleteMessage(mid: string) {
    await supabase.from('ticket_messages').delete().eq('id', mid)
    await load()
  }

  if (!ticket) return <p className="text-xl text-slate-500">Loading…</p>

  return (
    <div>
      <BackBar label="Back to help" to="/help" />
      <h1 className="mb-2 text-3xl font-bold text-slate-900">{ticket.subject}</h1>
      <p className="mb-6 text-lg text-slate-500">Reference {ticket.ticket_number}</p>

      <div className="space-y-4">
        {messages.map((m) => {
          const mine = m.author_role === 'customer'
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 text-lg ${
                  mine ? 'bg-blue-600 text-white' : 'border-2 border-slate-200 bg-white text-slate-800'
                }`}
              >
                <div className={`mb-1 text-sm font-semibold ${mine ? 'text-blue-100' : 'text-slate-400'}`}>
                  {mine ? 'You' : `${m.author_name} at HazIT`}
                </div>
                <div className="whitespace-pre-wrap">{m.body}</div>
              </div>
              {mine && (
                <button onClick={() => deleteMessage(m.id)} className="mt-0.5 px-1 text-sm text-slate-400 hover:text-red-600">
                  Delete
                </button>
              )}
            </div>
          )
        })}
      </div>

      {ticket.status !== 'closed' ? (
        <PortalCard className="mt-6">
          <label className="mb-2 block text-xl font-semibold text-slate-800">Add a reply</label>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={4}
            placeholder="Type your message to us here…"
            className="w-full rounded-xl border-2 border-slate-300 px-4 py-3.5 text-xl focus:border-blue-500 focus:outline-none"
          />
          <div className="mt-3 flex justify-end">
            <BigButton onClick={send} disabled={busy || !reply.trim()}>
              {busy ? 'Sending…' : 'Send reply'}
            </BigButton>
          </div>
        </PortalCard>
      ) : (
        <PortalCard className="mt-6 text-center text-lg text-slate-500">
          This request is closed. Start a new one any time from the Help page.
        </PortalCard>
      )}
    </div>
  )
}
