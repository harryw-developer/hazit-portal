import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useSettings } from '../lib/SettingsContext'
import {
  formatDayLabel,
  formatTime,
  parseSlotConfig,
  slotsForDate,
  upcomingWorkingDays,
} from '../lib/scheduling'
import type { Appointment, AppointmentStatus } from '../lib/types'
import { BackBar, BigButton, PageHeading, PortalCard, StatusPill } from './ui'
import { usePortalMode } from './mode'

const PILL: Record<AppointmentStatus, { text: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'gray' }> = {
  requested: { text: 'Requested', tone: 'amber' },
  confirmed: { text: 'Booked', tone: 'green' },
  completed: { text: 'Completed', tone: 'gray' },
  cancelled: { text: 'Cancelled', tone: 'gray' },
}

export default function PortalAppointments() {
  const { profile } = useAuth()
  const { settings } = useSettings()
  const easy = usePortalMode() === 'easy'
  const [mine, setMine] = useState<Appointment[]>([])
  const [booking, setBooking] = useState(false)
  const [service, setService] = useState('')
  const [dateISO, setDateISO] = useState('')
  const [takenIsos, setTakenIsos] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState('')
  const [error, setError] = useState('')

  const cfg = settings ? parseSlotConfig(settings) : null

  const loadMine = useCallback(async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .order('starts_at', { nullsFirst: false })
    setMine((data as Appointment[]) || [])
  }, [])

  useEffect(() => {
    void loadMine()
  }, [loadMine])

  async function pickDate(iso: string) {
    setDateISO(iso)
    setError('')
    const { data } = await supabase.rpc('booked_times', { p_date: iso })
    const set = new Set<string>((data as string[] | null)?.map((t) => new Date(t).toISOString()) || [])
    setTakenIsos(set)
  }

  async function book(slot: Date) {
    if (!service) {
      setError('Please choose what you need first.')
      return
    }
    setBusy(true)
    setError('')
    const { error } = await supabase.from('appointments').insert({
      customer_id: profile?.customer_id,
      service,
      starts_at: slot.toISOString(),
      duration_minutes: cfg?.slotMinutes || 60,
      status: 'confirmed',
      created_by: profile?.id,
    })
    setBusy(false)
    if (error) {
      // unique-violation → someone grabbed the slot
      setError('Sorry, that time was just taken. Please choose another.')
      await pickDate(dateISO)
      return
    }
    setDone(`Booked: ${service} on ${formatDayLabel(dateISO)} at ${formatTime(slot)}.`)
    setBooking(false)
    setService('')
    setDateISO('')
    await loadMine()
  }

  async function cancel(a: Appointment) {
    if (!window.confirm('Cancel this appointment?')) return
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', a.id)
    await loadMine()
  }

  const days = cfg ? upcomingWorkingDays(cfg, 14) : []
  const slots = cfg && dateISO ? slotsForDate(dateISO, cfg) : []
  const now = Date.now()

  const upcoming = mine.filter((a) => a.status !== 'cancelled' && a.status !== 'completed')
  const past = mine.filter((a) => a.status === 'completed' || a.status === 'cancelled')

  function when(a: Appointment) {
    if (a.starts_at) {
      const d = new Date(a.starts_at)
      return `${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} at ${formatTime(d)}`
    }
    return a.preferred_date ? `${a.preferred_date} ${a.preferred_time}` : 'Time to be arranged'
  }

  return (
    <div>
      <BackBar />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <PageHeading emoji="📅">Appointments</PageHeading>
        {!booking && (
          <BigButton onClick={() => { setBooking(true); setDone('') }}>➕ Book an appointment</BigButton>
        )}
      </div>

      {done && (
        <PortalCard className="mb-6 border-2 border-green-200 bg-green-50 text-lg text-green-800">✅ {done}</PortalCard>
      )}

      {booking && cfg && (
        <PortalCard className="mb-6 space-y-6">
          <div>
            <div className={`mb-2 font-semibold text-slate-800 ${easy ? 'text-xl' : 'text-lg'}`}>1. What do you need?</div>
            <div className="flex flex-wrap gap-2">
              {cfg.services.map((s) => (
                <button
                  key={s}
                  onClick={() => setService(s)}
                  className={`rounded-xl border-2 px-4 py-2.5 font-semibold ${
                    service === s ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className={`mb-2 font-semibold text-slate-800 ${easy ? 'text-xl' : 'text-lg'}`}>2. Pick a day</div>
            <div className="flex flex-wrap gap-2">
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => pickDate(d)}
                  className={`rounded-xl border-2 px-4 py-2.5 font-semibold ${
                    dateISO === d ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300'
                  }`}
                >
                  {formatDayLabel(d)}
                </button>
              ))}
            </div>
          </div>

          {dateISO && (
            <div>
              <div className={`mb-2 font-semibold text-slate-800 ${easy ? 'text-xl' : 'text-lg'}`}>3. Pick a time</div>
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => {
                  const taken = takenIsos.has(slot.toISOString()) || slot.getTime() < now
                  return (
                    <button
                      key={slot.toISOString()}
                      disabled={taken || busy}
                      onClick={() => book(slot)}
                      className={`rounded-xl border-2 px-4 py-2.5 font-semibold ${
                        taken
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300 line-through'
                          : 'border-green-400 bg-white text-green-800 hover:bg-green-50'
                      }`}
                    >
                      {formatTime(slot)}
                    </button>
                  )
                })}
                {slots.every((s) => takenIsos.has(s.toISOString()) || s.getTime() < now) && (
                  <span className="text-lg text-slate-500">No times left on this day — try another.</span>
                )}
              </div>
            </div>
          )}

          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-lg text-red-700">{error}</div>}
          <div className="flex justify-end">
            <BigButton variant="secondary" onClick={() => setBooking(false)}>Cancel</BigButton>
          </div>
        </PortalCard>
      )}

      {upcoming.length > 0 && (
        <div className="mb-6">
          <div className={`mb-2 font-bold text-slate-800 ${easy ? 'text-xl' : 'text-lg'}`}>Upcoming</div>
          <div className="space-y-3">
            {upcoming.map((a) => (
              <PortalCard key={a.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className={`font-bold text-slate-900 ${easy ? 'text-xl' : 'text-lg'}`}>{a.service}</div>
                  <div className="text-slate-500">{when(a)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill text={PILL[a.status].text} tone={PILL[a.status].tone} />
                  <BigButton variant="secondary" onClick={() => cancel(a)}>Cancel</BigButton>
                </div>
              </PortalCard>
            ))}
          </div>
        </div>
      )}

      {!booking && upcoming.length === 0 && (
        <PortalCard className="text-center text-lg text-slate-500">
          You have no appointments booked. Tap "Book an appointment" to arrange one.
        </PortalCard>
      )}

      {past.length > 0 && (
        <div className="mt-6">
          <div className={`mb-2 font-bold text-slate-500 ${easy ? 'text-lg' : 'text-base'}`}>Past</div>
          <div className="space-y-2">
            {past.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-500">
                <span>{a.service} — {when(a)}</span>
                <StatusPill text={PILL[a.status].text} tone={PILL[a.status].tone} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
