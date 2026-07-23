import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { BackBar, BigButton, PageHeading, PortalCard } from './ui'
import type { TicketPriority } from '../lib/types'

const URGENCY: { value: TicketPriority; label: string; hint: string }[] = [
  { value: 'normal', label: 'When you can', hint: 'It can wait a little while' },
  { value: 'high', label: 'Fairly urgent', hint: 'I need help soon' },
  { value: 'urgent', label: 'Very urgent', hint: 'I cannot work until this is fixed' },
]

export default function PortalNewTicket() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('normal')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) {
      setError('Please fill in both boxes so we can help you.')
      return
    }
    setBusy(true)
    setError('')
    const { data: ticket, error: tErr } = await supabase
      .from('tickets')
      .insert({
        customer_id: profile?.customer_id,
        subject: subject.trim(),
        priority,
        status: 'open',
        created_by: profile?.id,
      })
      .select('id')
      .single()
    if (tErr || !ticket) {
      setError('Something went wrong. Please try again, or call us.')
      setBusy(false)
      return
    }
    await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id,
      author_id: profile?.id,
      author_role: 'customer',
      author_name: profile?.full_name || 'Customer',
      body: body.trim(),
    })
    navigate(`/help/${ticket.id}`)
  }

  return (
    <div>
      <BackBar label="Back to help" to="/help" />
      <PageHeading emoji="✏️">Ask for help</PageHeading>
      <form onSubmit={submit}>
        <PortalCard className="space-y-6">
          <label className="block">
            <span className="mb-2 block text-xl font-semibold text-slate-800">
              What do you need help with?
            </span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              autoFocus
              placeholder="e.g. My email won't open"
              className="w-full rounded-xl border-2 border-slate-300 px-4 py-3.5 text-xl focus:border-blue-500 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xl font-semibold text-slate-800">
              Please tell us a bit more
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Describe what is happening. There are no silly questions!"
              className="w-full rounded-xl border-2 border-slate-300 px-4 py-3.5 text-xl focus:border-blue-500 focus:outline-none"
            />
          </label>

          <div>
            <span className="mb-2 block text-xl font-semibold text-slate-800">How urgent is it?</span>
            <div className="grid gap-3 sm:grid-cols-3">
              {URGENCY.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setPriority(u.value)}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    priority === u.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="text-lg font-bold text-slate-900">{u.label}</div>
                  <div className="text-base text-slate-500">{u.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-lg text-red-700" role="alert">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <BigButton variant="secondary" onClick={() => navigate('/help')}>
              Cancel
            </BigButton>
            <BigButton type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send to HazIT'}
            </BigButton>
          </div>
        </PortalCard>
      </form>
    </div>
  )
}
