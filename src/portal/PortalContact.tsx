import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useSettings } from '../lib/SettingsContext'
import type { Ticket, TicketMessage } from '../lib/types'
import { BackBar, BigButton, PageHeading, PortalCard } from './ui'
import { usePortalMode } from './mode'

const CHAT_CATEGORY = 'Live chat'

export default function PortalContact() {
  const { profile } = useAuth()
  const { settings } = useSettings()
  const easy = usePortalMode() === 'easy'
  const phone = settings?.phone || ''
  const email = settings?.support_email || 'help@hazit.co.uk'

  const [chat, setChat] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async (ticketId: string) => {
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at')
    setMessages((data as TicketMessage[]) || [])
  }, [])

  // Find the customer's most recent open live-chat, if any
  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('category', CHAT_CATEGORY)
        .neq('status', 'closed')
        .order('created_at', { ascending: false })
        .limit(1)
      const t = (data as Ticket[])?.[0] || null
      if (t) {
        setChat(t)
        await loadMessages(t.id)
      }
    })()
  }, [loadMessages])

  // Live updates for the active chat
  useEffect(() => {
    if (!chat) return
    const channel = supabase
      .channel(`chat-${chat.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${chat.id}` },
        () => void loadMessages(chat.id),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [chat, loadMessages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!text.trim() || busy) return
    setBusy(true)
    let ticket = chat
    if (!ticket) {
      const { data } = await supabase
        .from('tickets')
        .insert({
          customer_id: profile?.customer_id,
          subject: 'Live chat',
          category: CHAT_CATEGORY,
          status: 'open',
          created_by: profile?.id,
        })
        .select('*')
        .single()
      ticket = (data as Ticket) || null
      if (ticket) setChat(ticket)
    }
    if (!ticket) {
      setBusy(false)
      return
    }
    await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id,
      author_id: profile?.id,
      author_role: 'customer',
      author_name: profile?.full_name || 'Customer',
      body: text.trim(),
    })
    await supabase.from('tickets').update({ status: 'open', updated_at: new Date().toISOString() }).eq('id', ticket.id)
    setText('')
    setBusy(false)
    await loadMessages(ticket.id)
  }

  async function deleteMessage(id: string) {
    await supabase.from('ticket_messages').delete().eq('id', id)
    if (chat) await loadMessages(chat.id)
  }

  return (
    <div>
      <BackBar />
      <PageHeading emoji="☎️">Speak to Us</PageHeading>
      <p className={`mb-6 text-slate-600 ${easy ? 'text-lg' : 'text-base'}`}>
        Choose whichever is easiest for you — call, email, or chat with us right here.
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <PortalCard className="text-center">
          <div className="text-4xl" aria-hidden>📞</div>
          <div className={`mt-2 font-bold text-slate-900 ${easy ? 'text-xl' : 'text-lg'}`}>Call us</div>
          {phone ? (
            <>
              <div className={`mt-1 text-slate-600 ${easy ? 'text-lg' : 'text-base'}`}>{phone}</div>
              <a href={`tel:${phone.replace(/\s+/g, '')}`} className="mt-3 inline-block">
                <BigButton>Tap to call</BigButton>
              </a>
            </>
          ) : (
            <div className="mt-1 text-slate-500">Phone number coming soon</div>
          )}
        </PortalCard>

        <PortalCard className="text-center">
          <div className="text-4xl" aria-hidden>✉️</div>
          <div className={`mt-2 font-bold text-slate-900 ${easy ? 'text-xl' : 'text-lg'}`}>Email us</div>
          <div className={`mt-1 break-all text-slate-600 ${easy ? 'text-lg' : 'text-base'}`}>{email}</div>
          <a href={`mailto:${email}`} className="mt-3 inline-block">
            <BigButton variant="secondary">Send an email</BigButton>
          </a>
        </PortalCard>
      </div>

      <PortalCard>
        <div className={`mb-3 flex items-center gap-2 font-bold text-slate-900 ${easy ? 'text-xl' : 'text-lg'}`}>
          <span aria-hidden>💬</span> Live chat
        </div>
        <div className={`mb-3 rounded-xl bg-slate-50 p-4 ${easy ? 'min-h-[260px]' : 'min-h-[220px]'} max-h-[420px] overflow-y-auto`}>
          {messages.length === 0 ? (
            <p className={`text-slate-500 ${easy ? 'text-lg' : 'text-base'}`}>
              Send us a message below and we'll reply here. If we're not online right away, we'll get back
              to you as soon as we can.
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => {
                const mine = m.author_role === 'customer'
                return (
                  <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${easy ? 'text-lg' : 'text-base'} ${
                        mine ? 'bg-blue-600 text-white' : 'border-2 border-slate-200 bg-white text-slate-800'
                      }`}
                    >
                      <div className={`mb-0.5 text-xs font-semibold ${mine ? 'text-blue-100' : 'text-slate-400'}`}>
                        {mine ? 'You' : `${m.author_name || 'HazIT'} at HazIT`}
                      </div>
                      <div className="whitespace-pre-wrap">{m.body}</div>
                    </div>
                    {mine && (
                      <button
                        onClick={() => deleteMessage(m.id)}
                        className="mt-0.5 px-1 text-xs text-slate-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )
              })}
              <div ref={endRef} />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') send()
            }}
            placeholder="Type your message…"
            className={`w-full rounded-xl border-2 border-slate-300 px-4 focus:border-blue-500 focus:outline-none ${
              easy ? 'py-3.5 text-lg' : 'py-2.5 text-base'
            }`}
          />
          <BigButton onClick={send} disabled={busy || !text.trim()}>
            Send
          </BigButton>
        </div>
      </PortalCard>
    </div>
  )
}
