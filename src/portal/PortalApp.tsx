import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useSettings } from '../lib/SettingsContext'
import PortalInvoices from './PortalInvoices'
import PortalInvoiceView from './PortalInvoiceView'
import PortalTickets from './PortalTickets'
import PortalNewTicket from './PortalNewTicket'
import PortalTicketView from './PortalTicketView'
import PortalAppointments from './PortalAppointments'
import PortalDevices from './PortalDevices'
import PortalGuides from './PortalGuides'
import PortalQuotes from './PortalQuotes'
import InvoicePrintPage from '../pages/invoices/InvoicePrintPage'

const LOGO_URL =
  'https://lgxwgsiehprplflawjqd.supabase.co/storage/v1/object/public/branding/haz-it-logo.png'

const tiles = [
  { to: '/invoices', emoji: '📄', label: 'My Invoices', desc: 'View and pay your bills' },
  { to: '/help', emoji: '💬', label: 'Get Help', desc: 'Ask a question or report a problem' },
  { to: '/appointments', emoji: '📅', label: 'Appointments', desc: 'Book a visit or a call' },
  { to: '/quotes', emoji: '🧾', label: 'My Quotes', desc: 'Approve prices we have sent you' },
  { to: '/devices', emoji: '💻', label: 'My Devices', desc: 'Your computers and equipment' },
  { to: '/guides', emoji: '📖', label: 'Help Guides', desc: 'Simple step-by-step how-tos' },
]

function TopBar() {
  const { profile, signOut } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <button onClick={() => navigate('/')} className="flex items-center gap-3" title="Home">
          <img src={settings?.logo_url || LOGO_URL} alt="Home" className="h-11 w-auto object-contain" />
          <span className="sr-only">Home</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="hidden text-lg text-slate-600 sm:inline">
            Hello, <span className="font-semibold text-slate-800">{profile?.full_name || 'there'}</span>
          </span>
          <button
            onClick={() => void signOut()}
            className="rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-base font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}

function PortalHome() {
  const { profile } = useAuth()
  const { settings } = useSettings()
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="mt-2 text-xl text-slate-600">What would you like to do today?</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {tiles.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="flex items-center gap-5 rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
          >
            <span className="text-5xl" aria-hidden>
              {t.emoji}
            </span>
            <span>
              <span className="block text-2xl font-bold text-slate-900">{t.label}</span>
              <span className="mt-0.5 block text-lg text-slate-500">{t.desc}</span>
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-8 rounded-2xl bg-blue-50 p-6 text-center text-lg text-blue-900">
        Need to speak to someone? Call us on{' '}
        <span className="font-bold">{settings?.phone || 'our support line'}</span> — we're happy to help.
      </div>
    </div>
  )
}

export default function PortalApp() {
  return (
    <div className="min-h-screen bg-slate-100 text-[17px] text-slate-800">
      <TopBar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Routes>
          <Route path="/" element={<PortalHome />} />
          <Route path="/invoices" element={<PortalInvoices />} />
          <Route path="/invoices/:id" element={<PortalInvoiceView />} />
          <Route path="/invoices/:id/print" element={<InvoicePrintPage />} />
          <Route path="/help" element={<PortalTickets />} />
          <Route path="/help/new" element={<PortalNewTicket />} />
          <Route path="/help/:id" element={<PortalTicketView />} />
          <Route path="/appointments" element={<PortalAppointments />} />
          <Route path="/quotes" element={<PortalQuotes />} />
          <Route path="/devices" element={<PortalDevices />} />
          <Route path="/guides" element={<PortalGuides />} />
          <Route path="*" element={<PortalHome />} />
        </Routes>
      </main>
    </div>
  )
}
