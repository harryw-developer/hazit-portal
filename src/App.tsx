import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { HashRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { SettingsProvider, useSettings } from './lib/SettingsContext'
import {
  AppointmentsIcon,
  ContactsIcon,
  DevicesIcon,
  HazITMark,
  HelpdeskIcon,
  InvoiceAppIcon,
  KbIcon,
  QuotesIcon,
  SettingsIcon,
} from './components/icons'
import LoginPage from './pages/LoginPage'
import Desktop from './pages/AppsPage'
import SettingsPage from './pages/SettingsPage'
import InvoiceListPage from './pages/invoices/InvoiceListPage'
import InvoiceEditorPage from './pages/invoices/InvoiceEditorPage'
import InvoicePrintPage from './pages/invoices/InvoicePrintPage'
import CustomersPage from './pages/customers/CustomersPage'
import HelpdeskPage from './pages/helpdesk/HelpdeskPage'
import TicketPage from './pages/helpdesk/TicketPage'
import QuoteListPage from './pages/quotes/QuoteListPage'
import QuoteEditorPage from './pages/quotes/QuoteEditorPage'
import AppointmentsPage from './pages/appointments/AppointmentsPage'
import DevicesPage from './pages/devices/DevicesPage'
import KbAdminPage from './pages/kb/KbAdminPage'
import PortalApp from './portal/PortalApp'

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])
  return <>{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</>
}

const APP_META: Record<string, { title: string; icon: ReactNode }> = {
  '/settings': { title: 'Settings', icon: <SettingsIcon size={18} /> },
  '/apps/invoices': { title: 'Invoice Generator', icon: <InvoiceAppIcon size={18} /> },
  '/apps/customers': { title: 'Customers', icon: <ContactsIcon size={18} /> },
  '/apps/helpdesk': { title: 'Helpdesk', icon: <HelpdeskIcon size={18} /> },
  '/apps/quotes': { title: 'Quotes', icon: <QuotesIcon size={18} /> },
  '/apps/appointments': { title: 'Appointments', icon: <AppointmentsIcon size={18} /> },
  '/apps/devices': { title: 'Device Register', icon: <DevicesIcon size={18} /> },
  '/apps/kb': { title: 'Knowledge Base', icon: <KbIcon size={18} /> },
}

function metaFor(pathname: string) {
  const key = Object.keys(APP_META).find((k) => pathname.startsWith(k))
  return key ? APP_META[key] : null
}

function AppWindow({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="win-frame mx-auto mb-6 mt-6 w-full max-w-5xl">
      <div className="titlebar flex select-none items-center justify-between px-2 py-1.5">
        <div className="flex items-center gap-2 text-[13px] font-bold text-white">
          {icon}
          <span>{title}</span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="btn95 flex h-[22px] w-[24px] items-center justify-center !p-0 text-[14px] font-bold leading-none"
          title="Close"
        >
          ×
        </button>
      </div>
      <div className="win-body p-4">{children}</div>
    </div>
  )
}

function win(title: string, icon: ReactNode, node: ReactNode) {
  return (
    <AppWindow title={title} icon={icon}>
      {node}
    </AppWindow>
  )
}

function Taskbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { settings } = useSettings()
  const { signOut, profile } = useAuth()
  const meta = metaFor(pathname)
  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-40 flex h-10 items-center gap-2 border-t border-white bg-[#d4d0c8] px-2 shadow-[0_-1px_4px_rgba(0,0,0,0.25)]">
      <button
        onClick={() => navigate('/')}
        className="btn95 flex items-center gap-1.5 !py-1 font-bold"
        title="Show desktop"
      >
        {settings?.logo_url ? (
          <img src={settings.logo_url} alt="" className="h-4 w-4 object-contain" />
        ) : (
          <HazITMark size={16} />
        )}
        HazIT
      </button>
      {meta && <button className="btn95 pressed !py-1">{meta.title}</button>}
      <div className="flex-1" />
      <span className="hidden text-[12px] text-[#4b4a44] sm:inline">{profile?.full_name}</span>
      <button onClick={() => void signOut()} className="btn95 !py-1" title="Sign out">
        Log off
      </button>
      <div className="bevel-in px-3 py-0.5 text-[12px]">
        <Clock />
      </div>
    </div>
  )
}

// Staff desktop (retro theme)
function StaffApp() {
  return (
    <div className="app-shell min-h-screen px-3 pb-14">
      <Routes>
        <Route path="/" element={<Desktop />} />
        <Route path="/settings" element={win('Settings', <SettingsIcon size={18} />, <SettingsPage />)} />
        <Route path="/apps/invoices" element={win('Invoice Generator', <InvoiceAppIcon size={18} />, <InvoiceListPage />)} />
        <Route path="/apps/invoices/new" element={win('Invoice Generator', <InvoiceAppIcon size={18} />, <InvoiceEditorPage />)} />
        <Route path="/apps/invoices/:id" element={win('Invoice Generator', <InvoiceAppIcon size={18} />, <InvoiceEditorPage />)} />
        <Route path="/apps/invoices/:id/print" element={<InvoicePrintPage />} />
        <Route path="/apps/customers" element={win('Customers', <ContactsIcon size={18} />, <CustomersPage />)} />
        <Route path="/apps/helpdesk" element={win('Helpdesk', <HelpdeskIcon size={18} />, <HelpdeskPage />)} />
        <Route path="/apps/helpdesk/:id" element={win('Helpdesk', <HelpdeskIcon size={18} />, <TicketPage />)} />
        <Route path="/apps/quotes" element={win('Quotes', <QuotesIcon size={18} />, <QuoteListPage />)} />
        <Route path="/apps/quotes/new" element={win('Quotes', <QuotesIcon size={18} />, <QuoteEditorPage />)} />
        <Route path="/apps/quotes/:id" element={win('Quotes', <QuotesIcon size={18} />, <QuoteEditorPage />)} />
        <Route path="/apps/appointments" element={win('Appointments', <AppointmentsIcon size={18} />, <AppointmentsPage />)} />
        <Route path="/apps/devices" element={win('Device Register', <DevicesIcon size={18} />, <DevicesPage />)} />
        <Route path="/apps/kb" element={win('Knowledge Base', <KbIcon size={18} />, <KbAdminPage />)} />
      </Routes>
      <Taskbar />
    </div>
  )
}

function RootRouter() {
  const { loading, session, profile } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Loading…
      </div>
    )
  }
  if (!session) return <LoginPage />
  // Profile still resolving right after login
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Signing you in…
      </div>
    )
  }
  return profile.role === 'staff' ? <StaffApp /> : <PortalApp />
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <HashRouter>
          <RootRouter />
        </HashRouter>
      </SettingsProvider>
    </AuthProvider>
  )
}
