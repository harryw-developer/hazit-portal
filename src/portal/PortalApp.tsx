import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useSettings } from '../lib/SettingsContext'
import { PortalModeContext } from './mode'
import PortalInvoices from './PortalInvoices'
import PortalInvoiceView from './PortalInvoiceView'
import PortalTickets from './PortalTickets'
import PortalNewTicket from './PortalNewTicket'
import PortalTicketView from './PortalTicketView'
import PortalAppointments from './PortalAppointments'
import PortalDevices from './PortalDevices'
import PortalGuides from './PortalGuides'
import PortalQuotes from './PortalQuotes'
import PortalContact from './PortalContact'
import InvoicePrintPage from '../pages/invoices/InvoicePrintPage'

const LOGO_URL =
  'https://lgxwgsiehprplflawjqd.supabase.co/storage/v1/object/public/branding/haz-it-logo.png'

const tiles = [
  { to: '/invoices', emoji: '📄', label: 'My Invoices', desc: 'View and pay your bills' },
  { to: '/help', emoji: '💬', label: 'Get Help', desc: 'Ask a question or report a problem' },
  { to: '/contact', emoji: '☎️', label: 'Speak to Us', desc: 'Call, email or live chat' },
  { to: '/appointments', emoji: '📅', label: 'Appointments', desc: 'Book a visit or a call' },
  { to: '/quotes', emoji: '🧾', label: 'My Quotes', desc: 'Approve prices we have sent you' },
  { to: '/devices', emoji: '💻', label: 'My Devices', desc: 'Your computers and equipment' },
  { to: '/guides', emoji: '📖', label: 'Help Guides', desc: 'Simple step-by-step how-tos' },
]

function TopBar({ easy }: { easy: boolean }) {
  const { profile, signOut } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className={`mx-auto flex items-center justify-between gap-4 px-4 ${easy ? 'max-w-4xl py-3' : 'max-w-6xl py-2.5'}`}>
        <button onClick={() => navigate('/')} className="flex items-center gap-3" title="Home">
          <img src={settings?.logo_url || LOGO_URL} alt="Home" className={easy ? 'h-11 w-auto object-contain' : 'h-9 w-auto object-contain'} />
          <span className="sr-only">Home</span>
        </button>
        <div className="flex items-center gap-3">
          <span className={`hidden text-slate-600 sm:inline ${easy ? 'text-lg' : 'text-base'}`}>
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

function EasyHome() {
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
            <span className="text-5xl" aria-hidden>{t.emoji}</span>
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

function StandardHome() {
  const { profile } = useAuth()
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-slate-500">Your account at a glance.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-400 hover:shadow"
          >
            <span className="text-2xl" aria-hidden>{t.emoji}</span>
            <span>
              <span className="block font-semibold text-slate-900">{t.label}</span>
              <span className="mt-0.5 block text-sm text-slate-500">{t.desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function PortalApp() {
  const { profile } = useAuth()
  const mode = profile?.portal_mode || 'easy'
  const easy = mode === 'easy'

  return (
    <PortalModeContext.Provider value={mode}>
      <div className={`min-h-screen bg-slate-100 text-slate-800 ${easy ? 'text-[17px]' : 'text-[15px]'}`}>
        <TopBar easy={easy} />
        <main className={`mx-auto px-4 py-8 ${easy ? 'max-w-4xl' : 'max-w-6xl'}`}>
          <Routes>
            <Route path="/" element={easy ? <EasyHome /> : <StandardHome />} />
            <Route path="/invoices" element={<PortalInvoices />} />
            <Route path="/invoices/:id" element={<PortalInvoiceView />} />
            <Route path="/invoices/:id/print" element={<InvoicePrintPage />} />
            <Route path="/help" element={<PortalTickets />} />
            <Route path="/help/new" element={<PortalNewTicket />} />
            <Route path="/help/:id" element={<PortalTicketView />} />
            <Route path="/contact" element={<PortalContact />} />
            <Route path="/appointments" element={<PortalAppointments />} />
            <Route path="/quotes" element={<PortalQuotes />} />
            <Route path="/devices" element={<PortalDevices />} />
            <Route path="/guides" element={<PortalGuides />} />
            <Route path="*" element={easy ? <EasyHome /> : <StandardHome />} />
          </Routes>
        </main>
      </div>
    </PortalModeContext.Provider>
  )
}
