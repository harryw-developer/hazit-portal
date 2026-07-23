import type { DiscountType } from './types'

type LineLike = { quantity: number; unit_price: number; tax_rate: number }

export const CURRENCIES = ['GBP', 'EUR', 'USD'] as const

export function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency || 'GBP',
    minimumFractionDigits: 2,
  }).format(amount || 0)
}

export function formatDate(iso: string) {
  if (!iso) return ''
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function today() {
  return toISODate(new Date())
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export interface Totals {
  subtotal: number
  discountAmount: number
  taxTotal: number
  total: number
  taxBreakdown: { rate: number; amount: number }[]
}

const round = (n: number) => Math.round(n * 100) / 100

// Invoice-level discount is applied proportionally across lines before VAT,
// so the VAT breakdown stays correct per rate.
export function computeTotals(
  items: LineLike[],
  discountType: DiscountType,
  discountValue: number,
): Totals {
  const subtotal = items.reduce((s, it) => s + (it.quantity || 0) * (it.unit_price || 0), 0)
  let discountAmount = 0
  if (discountType === 'percent') discountAmount = (subtotal * (discountValue || 0)) / 100
  else if (discountType === 'fixed') discountAmount = Math.min(discountValue || 0, subtotal)
  const factor = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 1

  const byRate = new Map<number, number>()
  for (const it of items) {
    const net = (it.quantity || 0) * (it.unit_price || 0) * factor
    const rate = it.tax_rate || 0
    if (rate > 0) byRate.set(rate, (byRate.get(rate) || 0) + (net * rate) / 100)
  }
  const taxBreakdown = [...byRate.entries()]
    .map(([rate, amount]) => ({ rate, amount: round(amount) }))
    .sort((a, b) => a.rate - b.rate)
  const taxTotal = taxBreakdown.reduce((s, t) => s + t.amount, 0)

  return {
    subtotal: round(subtotal),
    discountAmount: round(discountAmount),
    taxTotal: round(taxTotal),
    total: round(subtotal - discountAmount + taxTotal),
    taxBreakdown,
  }
}
