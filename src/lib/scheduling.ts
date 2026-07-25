import type { Settings } from './types'

export interface SlotConfig {
  days: number[] // ISO weekday numbers, Mon=1 … Sun=7
  start: string // "09:00"
  end: string // "17:00"
  slotMinutes: number
  services: string[]
}

export function parseSlotConfig(s: Settings): SlotConfig {
  return {
    days: (s.booking_days || '1,2,3,4,5')
      .split(',')
      .map((x) => parseInt(x.trim(), 10))
      .filter((n) => !Number.isNaN(n)),
    start: s.booking_start || '09:00',
    end: s.booking_end || '17:00',
    slotMinutes: s.booking_slot_minutes || 60,
    services: (s.booking_services || '')
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean),
  }
}

function isoWeekday(d: Date) {
  const day = d.getDay() // 0=Sun … 6=Sat
  return day === 0 ? 7 : day
}

export function isWorkingDay(dateISO: string, cfg: SlotConfig) {
  return cfg.days.includes(isoWeekday(new Date(`${dateISO}T00:00:00`)))
}

// The next `count` working days (ISO date strings), starting today.
export function upcomingWorkingDays(cfg: SlotConfig, count = 14): string[] {
  const out: string[] = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  let guard = 0
  while (out.length < count && guard < 120) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (isWorkingDay(iso, cfg)) out.push(iso)
    d.setDate(d.getDate() + 1)
    guard++
  }
  return out
}

// All candidate slot start-times for a date (as Date objects in local time).
export function slotsForDate(dateISO: string, cfg: SlotConfig): Date[] {
  const [sh, sm] = cfg.start.split(':').map(Number)
  const [eh, em] = cfg.end.split(':').map(Number)
  const start = new Date(`${dateISO}T00:00:00`)
  start.setHours(sh, sm, 0, 0)
  const end = new Date(`${dateISO}T00:00:00`)
  end.setHours(eh, em, 0, 0)
  const slots: Date[] = []
  for (let t = start.getTime(); t < end.getTime(); t += cfg.slotMinutes * 60000) {
    slots.push(new Date(t))
  }
  return slots
}

export function formatTime(d: Date) {
  return d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })
}

export function formatDayLabel(dateISO: string) {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
