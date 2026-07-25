import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useSettings } from '../lib/SettingsContext'
import type { Settings } from '../lib/types'
import { CURRENCIES } from '../lib/format'
import { btnPrimary, btnSecondary, inputCls, labelCls } from '../lib/ui'

function Section({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <fieldset className="groupbox">
      <legend>{title}</legend>
      {desc && <p className="mb-3 text-[12px] text-[#4b4a44]">{desc}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`block text-sm ${wide ? 'sm:col-span-2' : ''}`}>
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  )
}

export default function SettingsPage() {
  const { settings, refresh } = useSettings()
  const [form, setForm] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (settings && !form) setForm(settings)
  }, [settings, form])

  if (!form) {
    return <div className="py-16 text-center text-sm text-[#4b4a44]">Loading settings…</div>
  }

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setForm((p) => (p ? { ...p, [k]: v } : p))

  async function save() {
    if (!form) return
    setSaving(true)
    setMessage('')
    const { id, ...fields } = form
    const { error } = await supabase.from('settings').update(fields).eq('id', id)
    setSaving(false)
    if (error) {
      setMessage(`Save failed: ${error.message}`)
    } else {
      setMessage('Settings saved.')
      await refresh()
    }
  }

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setMessage('')
    const ext = file.name.split('.').pop() || 'png'
    const path = `logo-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('branding').upload(path, file, { upsert: true })
    if (error) {
      setMessage(`Logo upload failed: ${error.message}`)
    } else {
      const { data } = supabase.storage.from('branding').getPublicUrl(path)
      await supabase.from('settings').update({ logo_url: data.publicUrl }).eq('id', 1)
      set('logo_url', data.publicUrl)
      await refresh()
      setMessage('Logo uploaded.')
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function removeLogo() {
    await supabase.from('settings').update({ logo_url: null }).eq('id', 1)
    set('logo_url', null)
    await refresh()
  }

  return (
    <div className="space-y-4 text-[13px]">
      <p className="text-[12px] text-[#4b4a44]">
        Global business details used across every app — including your invoices.
      </p>

      <Section title="Branding" desc="Your logo appears on invoices and other documents.">
        <div className="flex items-center gap-4 sm:col-span-2">
          <div className="bevel-in flex h-24 w-44 items-center justify-center p-2">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-xs text-[#8a867a]">No logo yet</span>
            )}
          </div>
          <div className="space-x-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className={btnSecondary}>
              {uploading ? 'Uploading…' : 'Upload logo…'}
            </button>
            {form.logo_url && (
              <button onClick={removeLogo} className={btnSecondary}>
                Remove
              </button>
            )}
          </div>
        </div>
        <Field label="Company name">
          <input className={inputCls} value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
        </Field>
        <Field label="Tagline">
          <input className={inputCls} value={form.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="Technical support" />
        </Field>
      </Section>

      <Section title="Contact details">
        <Field label="Email">
          <input className={inputCls} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Support email (shown on the customer portal)">
          <input className={inputCls} type="email" value={form.support_email} onChange={(e) => set('support_email', e.target.value)} placeholder="help@hazit.co.uk" />
        </Field>
        <Field label="Website" wide>
          <input className={inputCls} value={form.website} onChange={(e) => set('website', e.target.value)} />
        </Field>
      </Section>

      <Section title="Business address" desc="Shown on your invoice letterhead.">
        <Field label="Address line 1">
          <input className={inputCls} value={form.address_line1} onChange={(e) => set('address_line1', e.target.value)} />
        </Field>
        <Field label="Address line 2">
          <input className={inputCls} value={form.address_line2} onChange={(e) => set('address_line2', e.target.value)} />
        </Field>
        <Field label="Town / City">
          <input className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)} />
        </Field>
        <Field label="Postcode">
          <input className={inputCls} value={form.postcode} onChange={(e) => set('postcode', e.target.value)} />
        </Field>
        <Field label="Country">
          <input className={inputCls} value={form.country} onChange={(e) => set('country', e.target.value)} />
        </Field>
      </Section>

      <Section title="Registration">
        <Field label="VAT number">
          <input className={inputCls} value={form.vat_number} onChange={(e) => set('vat_number', e.target.value)} />
        </Field>
        <Field label="Company number">
          <input className={inputCls} value={form.company_number} onChange={(e) => set('company_number', e.target.value)} />
        </Field>
      </Section>

      <Section
        title="Invoice defaults"
        desc="Applied to every new invoice — you can still override them per invoice."
      >
        <Field label="Currency">
          <select className={inputCls} value={form.currency} onChange={(e) => set('currency', e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Default VAT rate (%)">
          <input
            className={inputCls}
            type="number"
            min="0"
            step="0.5"
            value={form.default_tax_rate}
            onChange={(e) => set('default_tax_rate', Number(e.target.value))}
          />
        </Field>
        <Field label="Payment terms (days)">
          <input
            className={inputCls}
            type="number"
            min="0"
            value={form.payment_terms_days}
            onChange={(e) => set('payment_terms_days', Number(e.target.value))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Invoice prefix">
            <input className={inputCls} value={form.invoice_prefix} onChange={(e) => set('invoice_prefix', e.target.value)} />
          </Field>
          <Field label="Next number">
            <input
              className={inputCls}
              type="number"
              min="1"
              value={form.next_invoice_number}
              onChange={(e) => set('next_invoice_number', Number(e.target.value))}
            />
          </Field>
        </div>
        <p className="-mt-1 text-[12px] text-[#4b4a44] sm:col-span-2">
          Next invoice will be numbered{' '}
          <b>
            {form.invoice_prefix}
            {String(form.next_invoice_number || 1).padStart(4, '0')}
          </b>
        </p>
        <Field label="Default notes (shown on invoices)" wide>
          <textarea
            className={inputCls}
            rows={2}
            value={form.invoice_notes}
            onChange={(e) => set('invoice_notes', e.target.value)}
            placeholder="Thank you for your business!"
          />
        </Field>
        <Field label="Invoice footer" wide>
          <input
            className={inputCls}
            value={form.invoice_footer}
            onChange={(e) => set('invoice_footer', e.target.value)}
            placeholder="HAZ IT — Registered in England and Wales"
          />
        </Field>
      </Section>

      <Section
        title="Bank details"
        desc="Printed on invoices so customers can pay by transfer. The Revolut payment link is added per invoice, since each invoice gets its own link."
      >
        <Field label="Account name">
          <input className={inputCls} value={form.bank_account_name} onChange={(e) => set('bank_account_name', e.target.value)} />
        </Field>
        <Field label="Bank name">
          <input className={inputCls} value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)} />
        </Field>
        <Field label="Sort code">
          <input className={inputCls} value={form.bank_sort_code} onChange={(e) => set('bank_sort_code', e.target.value)} placeholder="00-00-00" />
        </Field>
        <Field label="Account number">
          <input className={inputCls} value={form.bank_account_number} onChange={(e) => set('bank_account_number', e.target.value)} />
        </Field>
      </Section>

      <div className="flex items-center justify-end gap-3 pb-2">
        {message && <span className="text-[12px] text-[#4b4a44]">{message}</span>}
        <button onClick={save} disabled={saving} className={btnPrimary}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>

      <Section
        title="Appointment booking"
        desc="Controls the slots customers can choose from in their portal."
      >
        <div className="sm:col-span-2">
          <span className={labelCls}>Working days</span>
          <div className="flex flex-wrap gap-2">
            {[
              [1, 'Mon'],
              [2, 'Tue'],
              [3, 'Wed'],
              [4, 'Thu'],
              [5, 'Fri'],
              [6, 'Sat'],
              [7, 'Sun'],
            ].map(([n, label]) => {
              const days = (form.booking_days || '').split(',').map((x) => x.trim()).filter(Boolean)
              const on = days.includes(String(n))
              return (
                <button
                  key={String(n)}
                  type="button"
                  className={`btn95 ${on ? 'pressed' : ''}`}
                  onClick={() => {
                    const next = on ? days.filter((d) => d !== String(n)) : [...days, String(n)]
                    next.sort()
                    set('booking_days', next.join(','))
                  }}
                >
                  {label as string}
                </button>
              )
            })}
          </div>
        </div>
        <Field label="Day starts">
          <input className={inputCls} type="time" value={form.booking_start} onChange={(e) => set('booking_start', e.target.value)} />
        </Field>
        <Field label="Day ends">
          <input className={inputCls} type="time" value={form.booking_end} onChange={(e) => set('booking_end', e.target.value)} />
        </Field>
        <Field label="Appointment length (minutes)">
          <input
            className={inputCls}
            type="number"
            min="15"
            step="15"
            value={form.booking_slot_minutes}
            onChange={(e) => set('booking_slot_minutes', Number(e.target.value))}
          />
        </Field>
        <Field label="Services customers can book (one per line)" wide>
          <textarea
            className={inputCls}
            rows={4}
            value={form.booking_services}
            onChange={(e) => set('booking_services', e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Your login" desc="Change the password you use to sign in to this admin desktop.">
        <ChangePassword />
      </Section>
    </div>
  )
}

function ChangePassword() {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function change() {
    if (pw.length < 6) return setMsg('Use at least 6 characters.')
    if (pw !== pw2) return setMsg('The passwords do not match.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) setMsg(error.message)
    else {
      setMsg('Password changed.')
      setPw('')
      setPw2('')
    }
  }

  return (
    <div className="sm:col-span-2">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>New password</span>
          <input className={inputCls} type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </label>
        <label className="block">
          <span className={labelCls}>Confirm new password</span>
          <input className={inputCls} type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button className={btnSecondary} onClick={change} disabled={busy}>
          {busy ? 'Changing…' : 'Change password'}
        </button>
        {msg && <span className="text-[12px] text-[#4b4a44]">{msg}</span>}
      </div>
    </div>
  )
}
