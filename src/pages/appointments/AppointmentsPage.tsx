import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useSettings } from '../../lib/SettingsContext'
import { formatDate, today } from '../../lib/format'
import { formatTime, parseSlotConfig, slotsForDate } from '../../lib/scheduling'
import { btnPrimary, btnSecondary, inputCls, labelCls } from '../../lib/ui'
import type { Appointment, AppointmentStatus, Customer } from '../../lib/types'

type Row = Appointment & { customer: { name: string } | null }

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  requested: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-indigo-100 text-indigo-800',
  cancelled: 'bg-gray-200 text-gray-600',
}

function addDaysISO(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function AppointmentsPage() {
  const { settings } = useSettings()
  const [rows, setRows] = useState<Row[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [day, setDay] = useState(today())
  const [view, setView] = useState<'day' | 'list'>('day')
  const [booking, setBooking] = useState<{ slot: Date } | null>(null)

  const cfg = settings ? parseSlotConfig(settings) : null

  const load = useCallback(async () => {
    const [{ data }, { data: cs }] = await Promise.all([
      supabase.from('appointments').select('*, customer:customers(name)').order('starts_at', { nullsFirst: false }),
      supabase.from('customers').select('*').order('name'),
    ])
    setRows((data as Row[]) || [])
    setCustomers((cs as Customer[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function setStatus(a: Row, status: AppointmentStatus) {
    await supabase.from('appointments').update({ status }).eq('id', a.id)
    await load()
  }
  async function remove(a: Row) {
    if (!window.confirm('Delete this appointment permanently?')) return
    await supabase.from('appointments').delete().eq('id', a.id)
    await load()
  }
  async function saveNote(a: Row, staff_notes: string) {
    await supabase.from('appointments').update({ staff_notes }).eq('id', a.id)
  }

  // Bookings for the selected day, keyed by slot start time
  const dayBookings = useMemo(() => {
    const map = new Map<string, Row>()
    for (const r of rows) {
      if (!r.starts_at || r.status === 'cancelled') continue
      const d = new Date(r.starts_at)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (iso === day) map.set(new Date(r.starts_at).toISOString(), r)
    }
    return map
  }, [rows, day])

  const slots = cfg ? slotsForDate(day, cfg) : []
  const requests = rows.filter((r) => r.status === 'requested')
  const upcoming = rows.filter((r) => r.starts_at && r.status !== 'cancelled' && new Date(r.starts_at) >= new Date())

  return (
    <div className="text-[13px]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-[#4b4a44]">
          Your diary. Customers book free slots from their portal; you can book, move or cancel here.
        </p>
        <div className="flex gap-2">
          <button className={`btn95 ${view === 'day' ? 'pressed' : ''}`} onClick={() => setView('day')}>Day view</button>
          <button className={`btn95 ${view === 'list' ? 'pressed' : ''}`} onClick={() => setView('list')}>All bookings</button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="bevel-in px-3 py-2">
          <div className="text-[11px] text-[#4b4a44]">Upcoming</div>
          <div className="text-[18px] font-bold">{upcoming.length}</div>
        </div>
        <div className="bevel-in px-3 py-2">
          <div className="text-[11px] text-[#4b4a44]">Awaiting confirmation</div>
          <div className={`text-[18px] font-bold ${requests.length ? 'text-amber-700' : ''}`}>{requests.length}</div>
        </div>
        <div className="bevel-in px-3 py-2">
          <div className="text-[11px] text-[#4b4a44]">Booked today</div>
          <div className="text-[18px] font-bold">{dayBookings.size}</div>
        </div>
      </div>

      {view === 'day' ? (
        <>
          <div className="mb-2 flex items-center gap-2">
            <button className={btnSecondary} onClick={() => setDay(addDaysISO(day, -1))}>◀ Prev</button>
            <input className={`${inputCls} w-40`} type="date" value={day} onChange={(e) => setDay(e.target.value)} />
            <button className={btnSecondary} onClick={() => setDay(addDaysISO(day, 1))}>Next ▶</button>
            <button className={btnSecondary} onClick={() => setDay(today())}>Today</button>
            <span className="ml-2 font-bold">{formatDate(day)}</span>
          </div>

          <div className="bevel-in divide-y divide-[#d9d6cf]">
            {slots.length === 0 && <div className="p-4 text-center text-[#8a867a]">Not a working day (set working days in Settings).</div>}
            {slots.map((slot) => {
              const key = slot.toISOString()
              const b = dayBookings.get(key)
              return (
                <div key={key} className={`flex items-center gap-3 p-2 ${b ? 'bg-[#eef3fb]' : 'bg-white'}`}>
                  <span className="w-16 shrink-0 font-mono font-bold">{formatTime(slot)}</span>
                  {b ? (
                    <>
                      <span className="flex-1">
                        <b>{b.customer?.name || 'Unknown'}</b> — {b.service}
                        {b.staff_notes ? <span className="text-[11px] text-[#8a867a]"> · {b.staff_notes}</span> : null}
                      </span>
                      <span className={`rounded px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_COLOR[b.status]}`}>{b.status}</span>
                      {b.status === 'requested' && (
                        <button className="link95 text-green-700" onClick={() => setStatus(b, 'confirmed')}>Confirm</button>
                      )}
                      {b.status !== 'completed' && (
                        <button className="link95" onClick={() => setStatus(b, 'completed')}>Done</button>
                      )}
                      <button className="link95 text-red-600" onClick={() => setStatus(b, 'cancelled')}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-[#8a867a]">Free</span>
                      <button className="link95" onClick={() => setBooking({ slot })}>Book…</button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="bevel-in overflow-x-auto">
          <table className="tbl95 w-full min-w-[860px]">
            <thead>
              <tr>
                <th>When</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Status</th>
                <th>Staff notes</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="!p-6 text-center text-[#8a867a]">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="!p-6 text-center text-[#8a867a]">No appointments yet.</td></tr>
              ) : (
                rows.map((a) => (
                  <tr key={a.id} className="bg-white">
                    <td className="whitespace-nowrap">
                      {a.starts_at
                        ? `${formatDate(a.starts_at.slice(0, 10))} · ${formatTime(new Date(a.starts_at))}`
                        : a.preferred_date
                          ? `${formatDate(a.preferred_date)} ${a.preferred_time}`
                          : 'Not scheduled'}
                    </td>
                    <td className="font-bold">{a.customer?.name || '—'}</td>
                    <td>{a.service}</td>
                    <td>
                      <span className={`rounded px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_COLOR[a.status]}`}>{a.status}</span>
                    </td>
                    <td>
                      <input className={`${inputCls} !py-0.5 text-[12px]`} defaultValue={a.staff_notes} onBlur={(e) => saveNote(a, e.target.value)} placeholder="Add note…" />
                    </td>
                    <td className="whitespace-nowrap text-right">
                      {a.status === 'requested' && <button className="link95 mr-2 text-green-700" onClick={() => setStatus(a, 'confirmed')}>Confirm</button>}
                      {a.status !== 'completed' && a.status !== 'cancelled' && <button className="link95 mr-2" onClick={() => setStatus(a, 'completed')}>Done</button>}
                      <button className="link95 text-red-600" onClick={() => remove(a)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {booking && (
        <BookSlot
          slot={booking.slot}
          customers={customers}
          services={cfg?.services || []}
          duration={cfg?.slotMinutes || 60}
          onClose={() => setBooking(null)}
          onBooked={async () => {
            setBooking(null)
            await load()
          }}
        />
      )}
    </div>
  )
}

function BookSlot({
  slot,
  customers,
  services,
  duration,
  onClose,
  onBooked,
}: {
  slot: Date
  customers: Customer[]
  services: string[]
  duration: number
  onClose: () => void
  onBooked: () => void
}) {
  const [customerId, setCustomerId] = useState('')
  const [service, setService] = useState(services[0] || '')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!service.trim()) return
    setBusy(true)
    const { error } = await supabase.from('appointments').insert({
      customer_id: customerId || null,
      service: service.trim(),
      starts_at: slot.toISOString(),
      duration_minutes: duration,
      staff_notes: notes,
      status: 'confirmed',
    })
    setBusy(false)
    if (error) {
      setError('That slot is already booked.')
      return
    }
    onBooked()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="win-frame my-8 w-full max-w-md">
        <div className="titlebar flex items-center justify-between px-2 py-1.5">
          <span className="text-[13px] font-bold text-white">
            Book {slot.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} at {formatTime(slot)}
          </span>
          <button className="btn95 flex h-[22px] w-[24px] items-center justify-center !p-0 font-bold" onClick={onClose}>×</button>
        </div>
        <div className="space-y-3 p-4 text-[13px]">
          {error && <div className="bevel-in px-3 py-2 text-[12px] text-red-700">{error}</div>}
          <label className="block">
            <span className={labelCls}>Customer</span>
            <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">— None —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Service</span>
            <input className={inputCls} value={service} onChange={(e) => setService(e.target.value)} list="svc-list" />
            <datalist id="svc-list">
              {services.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <span className={labelCls}>Notes</span>
            <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <div className="flex justify-end gap-2">
            <button className={btnSecondary} onClick={onClose}>Cancel</button>
            <button className={btnPrimary} onClick={save} disabled={busy || !service.trim()}>
              {busy ? 'Booking…' : 'Book slot'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
