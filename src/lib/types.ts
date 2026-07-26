export interface Settings {
  id: number
  company_name: string
  tagline: string
  logo_url: string | null
  email: string
  phone: string
  website: string
  address_line1: string
  address_line2: string
  city: string
  postcode: string
  country: string
  vat_number: string
  company_number: string
  currency: string
  default_tax_rate: number
  payment_terms_days: number
  invoice_prefix: string
  next_invoice_number: number
  bank_name: string
  bank_sort_code: string
  bank_account_number: string
  bank_account_name: string
  invoice_notes: string
  invoice_footer: string
  revolut_link: string
  support_email: string
  booking_days: string
  booking_start: string
  booking_end: string
  booking_slot_minutes: number
  booking_services: string
}

export interface Customer {
  id: string
  name: string
  contact_name: string
  email: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  postcode: string
  country: string
  vat_number: string
  notes: string
  created_at?: string
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type DiscountType = 'none' | 'percent' | 'fixed'
export type ItemType = 'product' | 'service'

export interface InvoiceItem {
  id?: string
  invoice_id?: string
  position: number
  item_type: ItemType
  description: string
  details: string
  quantity: number
  unit: string
  unit_price: number
  tax_rate: number
}

export interface Invoice {
  id?: string
  invoice_number: string
  customer_id: string | null
  status: InvoiceStatus
  issue_date: string
  due_date: string
  currency: string
  discount_type: DiscountType
  discount_value: number
  po_reference: string
  payment_link: string
  notes: string
  terms: string
  subtotal: number
  tax_total: number
  total: number
  created_at?: string
  updated_at?: string
}

export type Role = 'staff' | 'customer'
export type PortalMode = 'easy' | 'standard'

export interface Profile {
  id: string
  role: Role
  customer_id: string | null
  username: string | null
  full_name: string
  shared_password: string
  portal_mode: PortalMode
  login_disabled: boolean
}

export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Ticket {
  id: string
  ticket_number: string
  customer_id: string | null
  subject: string
  status: TicketStatus
  priority: TicketPriority
  category: string
  created_by: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export interface TicketMessage {
  id: string
  ticket_id: string
  author_id: string | null
  author_role: Role
  author_name: string
  body: string
  internal: boolean
  created_at: string
}

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'declined' | 'expired' | 'converted'

export interface Quote {
  id?: string
  quote_number: string
  customer_id: string | null
  status: QuoteStatus
  issue_date: string
  valid_until: string
  currency: string
  discount_type: DiscountType
  discount_value: number
  notes: string
  terms: string
  subtotal: number
  tax_total: number
  total: number
  converted_invoice_id?: string | null
  responded_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface QuoteItem {
  id?: string
  quote_id?: string
  position: number
  item_type: ItemType
  description: string
  details: string
  quantity: number
  unit: string
  unit_price: number
  tax_rate: number
}

export type AppointmentStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled'

export interface Appointment {
  id: string
  customer_id: string | null
  service: string
  preferred_date: string | null
  preferred_time: string
  starts_at: string | null
  duration_minutes: number
  location: string
  notes: string
  status: AppointmentStatus
  staff_notes: string
  created_by: string | null
  created_at: string
}

export interface Device {
  id: string
  customer_id: string | null
  name: string
  device_type: string
  make_model: string
  serial_number: string
  location: string
  purchase_date: string | null
  warranty_until: string | null
  notes: string
  created_at: string
}

export type KbBodyFormat = 'text' | 'html'

export interface KbArticle {
  id: string
  title: string
  category: string
  summary: string
  body: string
  body_format: KbBodyFormat
  published: boolean
  created_at: string
  updated_at: string
}
