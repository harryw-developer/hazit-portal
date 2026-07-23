// HazIT brand mark: lightning bolt on a cyan gradient tile
export function HazITMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="hazit-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#hazit-g)" />
      <path d="M36 8 16 36h11l-5 20 22-32H32z" fill="#fff" />
    </svg>
  )
}

// Invoice Generator app logo: document with VAT lines and a currency badge
export function InvoiceAppIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="inv-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#inv-g)" />
      <path d="M18 10h20l8 8v36H18z" fill="#fff" />
      <path d="M38 10v8h8z" fill="#c7d2fe" />
      <rect x="23" y="24" width="18" height="2.5" rx="1.25" fill="#64748b" />
      <rect x="23" y="30" width="14" height="2.5" rx="1.25" fill="#cbd5e1" />
      <rect x="23" y="36" width="16" height="2.5" rx="1.25" fill="#cbd5e1" />
      <circle cx="42" cy="46" r="10" fill="#f59e0b" stroke="#fff" strokeWidth="2.5" />
      <text
        x="42"
        y="50.5"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="#fff"
        fontFamily="system-ui, sans-serif"
      >
        £
      </text>
    </svg>
  )
}

// Settings app icon: sliders on a gray tile
export function SettingsIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#64748b" />
      <g stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M16 22h32" />
        <path d="M16 32h32" />
        <path d="M16 42h32" />
      </g>
      <circle cx="26" cy="22" r="5.5" fill="#64748b" stroke="#fff" strokeWidth="3.5" />
      <circle cx="40" cy="32" r="5.5" fill="#64748b" stroke="#fff" strokeWidth="3.5" />
      <circle cx="30" cy="42" r="5.5" fill="#64748b" stroke="#fff" strokeWidth="3.5" />
    </svg>
  )
}

export function HelpdeskIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#0ea5e9" />
      <rect x="14" y="16" width="36" height="24" rx="6" fill="#fff" />
      <path d="M24 40v8l10-8z" fill="#fff" />
      <circle cx="24" cy="28" r="2.5" fill="#0ea5e9" />
      <circle cx="32" cy="28" r="2.5" fill="#0ea5e9" />
      <circle cx="40" cy="28" r="2.5" fill="#0ea5e9" />
    </svg>
  )
}

export function QuotesIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#10b981" />
      <path d="M18 10h20l8 8v36H18z" fill="#fff" />
      <path d="M38 10v8h8z" fill="#a7f3d0" />
      <rect x="23" y="26" width="18" height="2.5" rx="1.25" fill="#6ee7b7" />
      <rect x="23" y="32" width="14" height="2.5" rx="1.25" fill="#a7f3d0" />
      <path d="M26 44l4 4 9-9" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TimeIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#94a3b8" />
      <circle cx="32" cy="32" r="17" fill="#fff" />
      <path d="M32 22v10l7 5" stroke="#94a3b8" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ContactsIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#6366f1" />
      <circle cx="32" cy="25" r="8" fill="#fff" />
      <path d="M16 50c2-9 8-13 16-13s14 4 16 13z" fill="#fff" />
    </svg>
  )
}

export function AppointmentsIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#f59e0b" />
      <rect x="14" y="16" width="36" height="32" rx="4" fill="#fff" />
      <rect x="14" y="16" width="36" height="9" rx="4" fill="#fbbf24" />
      <rect x="21" y="11" width="4" height="9" rx="2" fill="#b45309" />
      <rect x="39" y="11" width="4" height="9" rx="2" fill="#b45309" />
      <path d="M22 38l4 4 8-9" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function DevicesIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#8b5cf6" />
      <rect x="14" y="18" width="28" height="20" rx="2" fill="#fff" />
      <rect x="12" y="40" width="32" height="3" rx="1.5" fill="#ddd6fe" />
      <rect x="44" y="22" width="10" height="24" rx="2" fill="#fff" />
      <rect x="47" y="42" width="4" height="1.6" rx="0.8" fill="#8b5cf6" />
    </svg>
  )
}

export function KbIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#ec4899" />
      <path d="M32 18c-5-3-11-3-15-2v27c4-1 10-1 15 2 5-3 11-3 15-2V16c-4-1-10-1-15 2z" fill="#fff" />
      <path d="M32 18v29" stroke="#fbcfe8" strokeWidth="2" />
    </svg>
  )
}
