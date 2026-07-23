import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

// Shared, deliberately large & high-contrast building blocks for the customer portal.

export function PortalCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function BackBar({ label = 'Back to home', to = '/' }: { label?: string; to?: string }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className="mb-6 inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-lg font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-700"
    >
      <span aria-hidden>←</span> {label}
    </button>
  )
}

export function PageHeading({ emoji, children }: { emoji: string; children: ReactNode }) {
  return (
    <h1 className="mb-6 flex items-center gap-3 text-3xl font-bold text-slate-900">
      <span aria-hidden className="text-4xl">
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
      className={`rounded-xl px-6 py-3.5 text-lg font-bold shadow-sm transition disabled:opacity-60 ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function EmptyState({ emoji, title, hint }: { emoji: string; title: string; hint?: string }) {
  return (
    <PortalCard className="text-center">
      <div className="text-5xl" aria-hidden>
        {emoji}
      </div>
      <div className="mt-3 text-xl font-semibold text-slate-700">{title}</div>
      {hint && <div className="mt-1 text-lg text-slate-500">{hint}</div>}
    </PortalCard>
  )
}

export function StatusPill({ text, tone }: { text: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'gray' }) {
  const styles = {
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-slate-200 text-slate-600',
  }[tone]
  return <span className={`inline-block rounded-full px-3 py-1 text-base font-semibold ${styles}`}>{text}</span>
}
