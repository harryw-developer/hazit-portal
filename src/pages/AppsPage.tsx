import { useNavigate } from 'react-router-dom'
import {
  AppointmentsIcon,
  ContactsIcon,
  DevicesIcon,
  HelpdeskIcon,
  InvoiceAppIcon,
  KbIcon,
  QuotesIcon,
  SettingsIcon,
} from '../components/icons'

const apps = [
  { icon: InvoiceAppIcon, label: 'Invoice Generator', to: '/apps/invoices' },
  { icon: ContactsIcon, label: 'Customers', to: '/apps/customers' },
  { icon: HelpdeskIcon, label: 'Helpdesk', to: '/apps/helpdesk' },
  { icon: QuotesIcon, label: 'Quotes', to: '/apps/quotes' },
  { icon: AppointmentsIcon, label: 'Appointments', to: '/apps/appointments' },
  { icon: DevicesIcon, label: 'Device Register', to: '/apps/devices' },
  { icon: KbIcon, label: 'Knowledge Base', to: '/apps/kb' },
  { icon: SettingsIcon, label: 'Settings', to: '/settings' },
]

export default function Desktop() {
  const navigate = useNavigate()
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col flex-wrap content-start gap-1 p-3">
      {apps.map(({ icon: Icon, label, to }) => (
        <button
          key={label}
          onClick={() => navigate(to)}
          className="flex w-28 flex-col items-center gap-1.5 rounded-sm p-2 hover:bg-white/10 focus:bg-blue-900/40 focus:outline-none"
        >
          <Icon size={48} />
          <span className="desktop-label text-center text-[12px] leading-tight text-white">
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
