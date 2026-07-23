import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import InvoicePreview from '../../components/InvoicePreview'
import { supabase } from '../../lib/supabase'
import { useSettings } from '../../lib/SettingsContext'
import type { Customer, Invoice, InvoiceItem } from '../../lib/types'

// Bare page containing only the invoice document. Opened by the editor's
// Print / PDF button; auto-opens the print dialog once everything has loaded.
export default function InvoicePrintPage() {
  const { id } = useParams()
  const { settings } = useSettings()
  const [inv, setInv] = useState<Invoice | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void (async () => {
      const { data: invoice } = await supabase.from('invoices').select('*').eq('id', id).single()
      if (!invoice || cancelled) return
      const { data: lines } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('position')
      let cust: Customer | null = null
      if (invoice.customer_id) {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .eq('id', invoice.customer_id)
          .single()
        cust = (data as Customer) || null
      }
      if (cancelled) return
      setInv(invoice as Invoice)
      setItems((lines as InvoiceItem[]) || [])
      setCustomer(cust)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const ready = Boolean(settings && inv)

  useEffect(() => {
    if (!ready || !inv) return
    document.title = `Invoice ${inv.invoice_number}`
    let cancelled = false
    void (async () => {
      // Wait for the logo (and any other images) before opening the dialog
      await Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise((resolve) => {
                img.onload = img.onerror = resolve
              }),
          ),
      )
      if (cancelled) return
      window.addEventListener(
        'afterprint',
        () => {
          if (window.opener) window.close()
        },
        { once: true },
      )
      setTimeout(() => window.print(), 150)
    })()
    return () => {
      cancelled = true
    }
  }, [ready, inv])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500">
        Preparing invoice…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-6">
      <InvoicePreview settings={settings!} invoice={inv!} items={items} customer={customer} />
    </div>
  )
}
