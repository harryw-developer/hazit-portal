import type { Customer, Invoice, InvoiceItem, Settings } from '../lib/types'
import { computeTotals, formatDate, formatMoney } from '../lib/format'

interface Props {
  settings: Settings
  invoice: Invoice
  items: InvoiceItem[]
  customer: Customer | null
}

export default function InvoicePreview({ settings, invoice, items, customer }: Props) {
  const totals = computeTotals(items, invoice.discount_type, invoice.discount_value)
  const fm = (n: number) => formatMoney(n, invoice.currency)

  const companyLines = [
    settings.address_line1,
    settings.address_line2,
    [settings.city, settings.postcode].filter(Boolean).join(' '),
    settings.country,
  ].filter(Boolean)
  const contactLines = [settings.email, settings.phone, settings.website].filter(Boolean)
  const customerLines = customer
    ? [
        customer.contact_name,
        customer.address_line1,
        customer.address_line2,
        [customer.city, customer.postcode].filter(Boolean).join(' '),
        customer.country,
      ].filter(Boolean)
    : []
  const bankRows = (
    [
      ['Account name', settings.bank_account_name],
      ['Bank', settings.bank_name],
      ['Sort code', settings.bank_sort_code],
      ['Account number', settings.bank_account_number],
      ['Reference', invoice.invoice_number],
    ] as const
  ).filter(([, v]) => v)
  const hasBank = Boolean(
    settings.bank_account_number || settings.bank_sort_code || settings.bank_name,
  )

  const visibleItems = items.filter(
    (it) => it.description.trim() || it.quantity !== 0 || it.unit_price !== 0,
  )

  const meta: [string, string][] = [
    ['Invoice number', invoice.invoice_number],
    ['Issue date', formatDate(invoice.issue_date)],
    ['Due date', formatDate(invoice.due_date)],
    ['Reference', invoice.po_reference || '—'],
  ]

  return (
    <div className="print-area relative mx-auto max-w-[820px] rounded-sm bg-white p-10 text-[13px] leading-snug text-slate-700 shadow-2xl">
      {invoice.status === 'paid' && (
        <div className="absolute right-12 top-36 -rotate-12 rounded-md border-4 border-emerald-500 px-5 py-1 text-3xl font-black uppercase tracking-widest text-emerald-500 opacity-60">
          Paid
        </div>
      )}

      {/* Letterhead */}
      <div className="flex items-start justify-between gap-8">
        <div>
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.company_name}
              className="max-h-20 max-w-52 object-contain object-left"
            />
          ) : (
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {settings.company_name}
            </div>
          )}
        </div>
        <div className="text-right text-xs leading-[1.35] text-slate-500">
          <div className="text-sm font-bold text-slate-900">{settings.company_name}</div>
          {settings.tagline && <div>{settings.tagline}</div>}
          {companyLines.map((l) => (
            <div key={l}>{l}</div>
          ))}
          {contactLines.map((l) => (
            <div key={l}>{l}</div>
          ))}
          {settings.vat_number && <div>VAT No: {settings.vat_number}</div>}
          {settings.company_number && <div>Company No: {settings.company_number}</div>}
        </div>
      </div>

      {/* Brand rule */}
      <div className="mt-5 h-1 w-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600" />

      {/* Title */}
      <div className="mt-5 flex items-end justify-between gap-6">
        <div className="text-[28px] font-black tracking-tight text-slate-900">INVOICE</div>
        <div className="rounded-md bg-slate-50 px-4 py-2 text-right ring-1 ring-slate-200">
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Amount due
          </div>
          <div className="font-mono text-xl font-bold text-slate-900">{fm(totals.total)}</div>
          <div className="text-[10px] text-slate-500">by {formatDate(invoice.due_date)}</div>
        </div>
      </div>

      {/* Meta strip */}
      <div className="mt-4 grid grid-cols-2 divide-slate-200 overflow-hidden rounded-md border border-slate-200 sm:grid-cols-4 sm:divide-x">
        {meta.map(([k, v]) => (
          <div key={k} className="px-3.5 py-2">
            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {k}
            </div>
            <div className="mt-0.5 font-semibold text-slate-800">{v}</div>
          </div>
        ))}
      </div>

      {/* Bill to */}
      <div className="mt-5">
        <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Billed to
        </div>
        {customer ? (
          <div className="mt-1 leading-[1.4]">
            <div className="text-sm font-bold text-slate-900">{customer.name}</div>
            {customerLines.map((l) => (
              <div key={l} className="text-slate-600">
                {l}
              </div>
            ))}
            {customer.email && <div className="text-slate-600">{customer.email}</div>}
            {customer.vat_number && <div className="text-slate-600">VAT No: {customer.vat_number}</div>}
          </div>
        ) : (
          <div className="mt-1 italic text-slate-400">No customer selected</div>
        )}
      </div>

      {/* Line items */}
      <table className="mt-5 w-full border-collapse">
        <thead>
          <tr className="border-y-2 border-slate-900 text-left text-[9px] uppercase tracking-[0.14em] text-slate-500">
            <th className="py-2 pr-2 font-semibold">Description</th>
            <th className="px-2 py-2 text-right font-semibold">Qty</th>
            <th className="px-2 py-2 text-right font-semibold">Unit price</th>
            <th className="px-2 py-2 text-right font-semibold">VAT</th>
            <th className="py-2 pl-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {visibleItems.map((it, i) => (
            <tr key={i} className="border-b border-slate-200 align-top">
              <td className="py-2 pr-2">
                <div className="font-semibold text-slate-800">{it.description}</div>
                {it.details && (
                  <div className="mt-0.5 whitespace-pre-line text-xs text-slate-500">{it.details}</div>
                )}
              </td>
              <td className="whitespace-nowrap px-2 py-2 text-right">
                {it.quantity}
                {it.item_type === 'service' ? ' hrs' : it.unit ? ` ${it.unit}` : ''}
              </td>
              <td className="whitespace-nowrap px-2 py-2 text-right font-mono">
                {fm(it.unit_price)}
                {it.item_type === 'service' ? '/hr' : ''}
              </td>
              <td className="px-2 py-2 text-right">{it.tax_rate}%</td>
              <td className="whitespace-nowrap py-2 pl-2 text-right font-mono">
                {fm(it.quantity * it.unit_price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-3 flex justify-end break-inside-avoid">
        <div className="w-64 space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono">{fm(totals.subtotal)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>
                Discount
                {invoice.discount_type === 'percent' ? ` (${invoice.discount_value}%)` : ''}
              </span>
              <span className="font-mono">−{fm(totals.discountAmount)}</span>
            </div>
          )}
          {totals.taxBreakdown.map((t) => (
            <div key={t.rate} className="flex justify-between text-slate-600">
              <span>VAT @ {t.rate}%</span>
              <span className="font-mono">{fm(t.amount)}</span>
            </div>
          ))}
          <div className="mt-0.5 flex justify-between border-t-2 border-slate-900 pt-1.5 text-base font-bold text-slate-900">
            <span>Total due</span>
            <span className="font-mono">{fm(totals.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment */}
      {(hasBank || invoice.payment_link) && (
        <div className="mt-6 break-inside-avoid rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            How to pay
          </div>
          <div className="mt-2 grid gap-5 sm:grid-cols-2">
            {hasBank && (
              <div>
                <div className="text-xs font-bold text-slate-700">Bank transfer</div>
                <table className="mt-1 text-xs leading-[1.5]">
                  <tbody>
                    {bankRows.map(([k, v]) => (
                      <tr key={k}>
                        <td className="pr-4 text-slate-500">{k}</td>
                        <td className="font-mono font-medium text-slate-800">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {invoice.payment_link && (
              <div>
                <div className="text-xs font-bold text-slate-700">Pay online</div>
                <div className="mt-1 text-xs leading-[1.5] text-slate-500">
                  Pay securely by card or Revolut:
                </div>
                <a
                  href={invoice.payment_link}
                  className="break-all text-xs font-medium text-blue-600 underline"
                >
                  {invoice.payment_link}
                </a>
              </div>
            )}
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Please quote invoice number{' '}
            <span className="font-mono font-medium text-slate-600">{invoice.invoice_number}</span> as
            your payment reference.
          </div>
        </div>
      )}

      {/* Notes + terms */}
      {(invoice.notes || invoice.terms) && (
        <div className="mt-5 grid gap-5 break-inside-avoid text-xs leading-[1.5] sm:grid-cols-2">
          {invoice.notes && (
            <div>
              <div className="font-semibold uppercase tracking-[0.14em] text-slate-400">Notes</div>
              <div className="mt-1 whitespace-pre-line text-slate-600">{invoice.notes}</div>
            </div>
          )}
          {invoice.terms && (
            <div>
              <div className="font-semibold uppercase tracking-[0.14em] text-slate-400">Terms</div>
              <div className="mt-1 whitespace-pre-line text-slate-600">{invoice.terms}</div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400">
        {settings.invoice_footer || `${settings.company_name} — thank you for your business.`}
      </div>
    </div>
  )
}
