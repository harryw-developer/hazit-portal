import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { formatDate } from '../lib/format'
import type { Appointment, AppointmentStatus } from '../lib/types'
import { BackBar, BigButton, PageHeading, PortalCard, StatusPill } from './ui'

const PILL: Record<AppointmentStatus, { text: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'gray' }> = {
  requested: { text: 'Requested', tone: 'amber' },
  confirmed: { text: 'Confirmed', tone: 'green' },
  completed: { text: 'Completed', tone: 'gray' },
  cancelled: { text: 'Cancelled', tone: 'gray' },
}

export default function PortalAppointments() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<Appointment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ service: '', preferred_date: '', preferred_time: '', notes: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('appointments').select('*').order('created_at', { ascending: false })
    setRows((data as Appointment[]) || [])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.service.trim()) return
    setBusy(true)
    await supabase.from('appointments').insert({
      customer_id: profile?.customer_id,
      service: form.service.trim(),
      preferred_date: form.preferred_date || null,
      preferred_time: form.preferred_time,
      notes: form.notes,
      status: 'requested',
      created_by: profile?.id,
    })
    setBusy(false)
    setDone(true)
    setShowForm(false)
    setForm({ service: '', preferred_date: '', preferred_time: '', notes: '' })
    await load()
  }

  return (
    <div>
      <BackBar />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <PageHeading emoji="📅">Appointments</PageHeading>
        {!showForm && <BigButton onClick={() => { setShowForm(true); setDone(false) }}>➕ Request a visit</BigButton>}
      </div>

      {done && (
        <PortalCard className="mb-6 border-2 border-green-200 bg-green-50 text-lg text-green-800">
          ✅ Thank you! We've received your request and will confirm a time with you shortly.
        </PortalCard>
      )}

      {showForm && (
        <form onSubmit={submit}>
          <PortalCard className="mb-6 space-y-5">
            <label className="block">
              <span className="mb-2 block text-xl font-semibold text-slate-800">What do you need?</span>
              <input
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
                autoFocus
                placeholder="e.g. Set up my new printer"
                className="w-full rounded-xl border-2 border-slate-300 px-4 py-3.5 text-xl focus:border-blue-500 focus:outline-none"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xl font-semibold text-slate-800">Preferred day</span>
                <input
                  type="date"
                  value={form.preferred_date}
                  onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                  className="w-full rounded-xl border-2 border-slate-300 px-4 py-3.5 text-xl focus:border-blue-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xl font-semibold text-slate-800">Best time</span>
                <input
                  value={form.preferred_time}
                  onChange={(e) => setForm({ ...form, preferred_time: e.target.value })}
                  placeholder="e.g. morning, or 2pm"
                  className="w-full rounded-xl border-2 border-slate-300 px-4 py-3.5 text-xl focus:border-blue-500 focus:outline-none"
                />
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <BigButton variant="secondary" onClick={() => setShowForm(false)}>Cancel</BigButton>
              <BigButton type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send request'}</BigButton>
            </div>
          </PortalCard>
        </form>
      )}

      {rows.length === 0 && !showForm ? (
        <PortalCard className="text-center text-lg text-slate-500">
          You have no appointments booked. Tap ‘Request a visit’ to arrange one.
        </PortalCard>
      ) : (
        <div className="space-y-4">
          {rows.map((a) => {
            const p = PILL[a.status]
            return (
              <PortalCard key={a.id} className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xl font-bold text-slate-900">{a.service}</div>
                  <div className="mt-1 text-lg text-slate-500">
                    {a.preferred_date ? formatDate(a.preferred_date) : 'Date to be arranged'}
                    {a.preferred_time ? ` · ${a.preferred_time}` : ''}
                  </div>
                </div>
                <StatusPill text={p.text} tone={p.tone} />
              </PortalCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
