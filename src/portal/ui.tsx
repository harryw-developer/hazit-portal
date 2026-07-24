import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalMode } from './mode'

// Shared building blocks for the customer portal. Each adapts to the
// per-user display mode: 'easy' (large & simple) or 'standard' (compact).

export function PortalCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const easy = usePortalMode() === 'easy'
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${easy ? 'p-6' : 'p-4'} ${className}`}
    >
      {children}
    </div>
  )
}

export function BackBar({ label = 'Back to home', to = '/' }: { label?: string; to?: string }) {
  const navigate = useNavigate()
  const easy = usePortalMode() === 'easy'
  return (
    <button
      onClick={() => navigate(to)}
      className={`mb-6 inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-700 ${
        easy ? 'px-5 py-3 text-lg' : 'px-4 py-2 text-base'
      }`}
    >
      <span aria-hidden>←</span> {label}
    </button>
  )
}

export function PageHeading({ emoji, children }: { emoji: string; children: ReactNode }) {
  const easy = usePortalMode() === 'easy'
  return (
    <h1 className={`mb-6 flex items-center gap-3 font-bold text-slate-900 ${easy ? 'text-3xl' : 'text-2xl'}`}>
      <span aria-hidden className={easy ? 'text-4xl' : 'text-2xl'}>
        {emoji}
      </span>
      {children}
    </h1>
  )
}

export function BigButton({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'success'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}) {
  const easy = usePortalMode() === 'easy'
  const styles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'border-2 border-slate-300 bg-white text-slate-700 hover:border-blue-400',
    success: 'bg-green-600 text-white hover:bg-green-700',
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl font-bold shadow-sm transition disabled:opacity-60 ${
        easy ? 'px-6 py-3.5 text-lg' : 'px-5 py-2.5 text-base'
      } ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function EmptyState({ emoji, title, hint }: { emoji: string; title: string; hint?: string }) {
  const easy = usePortalMode() === 'easy'
  return (
    <PortalCard className="text-center">
      <div className={easy ? 'text-5xl' : 'text-4xl'} aria-hidden>
        {emoji}
      </div>
      <div className={`mt-3 font-semibold text-slate-700 ${easy ? 'text-xl' : 'text-lg'}`}>{title}</div>
      {hint && <div className={`mt-1 text-slate-500 ${easy ? 'text-lg' : 'text-base'}`}>{hint}</div>}
    </PortalCard>
  )
}

export function StatusPill({ text, tone }: { text: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'gray' }) {
  const easy = usePortalMode() === 'easy'
  const styles = {
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-slate-200 text-slate-600',
  }[tone]
  return (
    <span
      className={`inline-block rounded-full font-semibold ${easy ? 'px-3 py-1 text-base' : 'px-2.5 py-0.5 text-sm'} ${styles}`}
    >
      {text}
    </span>
  )
}
