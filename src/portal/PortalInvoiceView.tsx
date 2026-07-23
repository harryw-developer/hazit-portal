import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import InvoicePreview from '../components/InvoicePreview'
import { supabase } from '../lib/supabase'
import { appUrl } from '../lib/routes'
import { useSettings } from '../lib/SettingsContext'
import { formatMoney } from '../lib/format'
import type { Customer, Invoice, InvoiceItem } from '../lib/types'
import { BackBar, BigButton, PortalCard } from './ui'

export default function PortalInvoiceView() {
  const { id } = useParams()
  const { settings } = useSettings()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    if (!id) return
    void (async () => {
      const { data: inv } = await supabase.from('invoices').select('*').eq('id', id).single()
      if (!inv) return
      const { data: lines } = await supabase.from('invoice_items').select('*').eq('invoice_id', id).order('position')
      let cust: Customer | null = null
      if (inv.customer_id) {
        const { data } = await supabase.from('customers').select('*').eq('id', inv.customer_id).single()
        cust = (data as Customer) || null
      }
      setInvoice(inv as Invoice)
      setItems((lines as InvoiceItem[]) || [])
      setCustomer(cust)
    })()
  }, [id])

  if (!settings || !invoice) return <p className="text-xl text-slate-500">Loading…</p>

  const unpaid = invoice.status !== 'paid' && invoice.status !== 'cancelled'

  return (
    <div>
      <BackBar label="Back to invoices" to="/invoices" />

      {unpaid && (
        <PortalCard className="mb-6 border-2 border-blue-200 bg-blue-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-lg text-slate-600">Amount to pay</div>
              <div className="text-3xl font-bold text-slate-900">
                {formatMoney(invoice.total, invoice.currency)}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {invoice.payment_link && (
                <a href={invoice.payment_link} target="_blank" rel="noreferrer">
                  <BigButton variant="success">💳 Pay online now</BigButton>
                </a>
              )}
              <BigButton variant="secondary" onClick={() => window.open(appUrl(`/invoices/${invoice.id}/print`), '_blank')}>
                🖨️ Print / Save
              </BigButton>
            </div>
          </div>
          {(settings.bank_account_number || settings.bank_sort_code) && (
            <p className="mt-4 text-base text-slate-600">
              Prefer bank transfer? Pay to <b>{settings.bank_account_name || settings.company_name}</b>,
              sort code <b>{settings.bank_sort_code}</b>, account <b>{settings.bank_account_number}</b>,
              using reference <b>{invoice.invoice_number}</b>.
            </p>
          )}
        </PortalCard>
      )}

      <InvoicePreview settings={settings} invoice={invoice} items={items} customer={customer} />
    </div>
  )
}
