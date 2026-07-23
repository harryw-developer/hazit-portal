import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { btnPrimary, btnSecondary, inputCls, labelCls } from '../../lib/ui'
import type { Customer, Profile } from '../../lib/types'

const empty: Omit<Customer, 'id'> = {
  name: '',
  contact_name: '',
  email: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  postcode: '',
  country: 'United Kingdom',
  vat_number: '',
  notes: '',
}

function RetroModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="win-frame my-8 w-full max-w-lg">
        <div className="titlebar flex items-center justify-between px-2 py-1.5">
          <span className="text-[13px] font-bold text-white">{title}</span>
          <button onClick={onClose} className="btn95 flex h-[22px] w-[24px] items-center justify-center !p-0 font-bold leading-none">
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<(Omit<Customer, 'id'> & { id?: string }) | null>(null)
  const [loginFor, setLoginFor] = useState<Customer | null>(null)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const [{ data: cs }, { data: ps }] = await Promise.all([
      supabase.from('customers').select('*').order('name'),
      supabase.from('profiles').select('*').eq('role', 'customer'),
    ])
    setCustomers((cs as Customer[]) || [])
    setProfiles((ps as Profile[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const profileFor = (id: string) => profiles.find((p) => p.customer_id === id) || null

  async function saveCustomer() {
    if (!editing || !editing.name.trim()) return
    const { id, ...fields } = editing
    if (id) await supabase.from('customers').update(fields).eq('id', id)
    else await supabase.from('customers').insert(fields)
    setEditing(null)
    await load()
  }

  return (
    <div className="text-[13px]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] text-[#4b4a44]">
          Your customer directory. Details here are shared by every app (invoices, tickets, quotes…).
        </p>
        <button className={btnPrimary} onClick={() => setEditing({ ...empty })}>
          New customer…
        </button>
      </div>
      {msg && <div className="bevel-in mb-3 px-3 py-2 text-[12px]">{msg}</div>}

      <div className="bevel-in overflow-x-auto">
        <table className="tbl95 w-full min-w-[720px]">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Portal login</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="!p-6 text-center text-[#8a867a]">
                  Loading…
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="!p-6 text-center text-[#8a867a]">
                  No customers yet — add your first one.
                </td>
              </tr>
            ) : (
              customers.map((c) => {
                const prof = profileFor(c.id)
                return (
                  <tr key={c.id} className="bg-white">
                    <td className="font-bold">{c.name}</td>
                    <td>{c.contact_name || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.phone || '—'}</td>
                    <td>
                      {prof ? (
                        <span className="text-green-700">✓ {prof.username || 'enabled'}</span>
                      ) : (
                        <span className="text-[#8a867a]">none</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button className="link95 mr-3" onClick={() => setEditing({ ...c })}>
                        Edit
                      </button>
                      <button className="link95" onClick={() => setLoginFor(c)}>
                        {prof ? 'Manage login' : 'Create login'}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <RetroModal title={editing.id ? 'Edit customer' : 'New customer'} onClose={() => setEditing(null)}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelCls}>Business / customer name *</span>
              <input className={inputCls} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </label>
            <label className="block">
              <span className={labelCls}>Contact name</span>
              <input className={inputCls} value={editing.contact_name} onChange={(e) => setEditing({ ...editing, contact_name: e.target.value })} />
            </label>
            <label className="block">
              <span className={labelCls}>Email</span>
              <input className={inputCls} type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </label>
            <label className="block">
              <span className={labelCls}>Phone</span>
              <input className={inputCls} value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            </label>
            <label className="block">
              <span className={labelCls}>VAT number</span>
              <input className={inputCls} value={editing.vat_number} onChange={(e) => setEditing({ ...editing, vat_number: e.target.value })} />
            </label>
            <label className="block">
              <span className={labelCls}>Address line 1</span>
              <input className={inputCls} value={editing.address_line1} onChange={(e) => setEditing({ ...editing, address_line1: e.target.value })} />
            </label>
            <label className="block">
              <span className={labelCls}>Address line 2</span>
              <input className={inputCls} value={editing.address_line2} onChange={(e) => setEditing({ ...editing, address_line2: e.target.value })} />
            </label>
            <label className="block">
              <span className={labelCls}>Town / City</span>
              <input className={inputCls} value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
            </label>
            <label className="block">
              <span className={labelCls}>Postcode</span>
              <input className={inputCls} value={editing.postcode} onChange={(e) => setEditing({ ...editing, postcode: e.target.value })} />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Notes</span>
              <textarea className={inputCls} rows={2} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className={btnSecondary} onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className={btnPrimary} onClick={saveCustomer} disabled={!editing.name.trim()}>
              Save customer
            </button>
          </div>
        </RetroModal>
      )}

      {loginFor && (
        <LoginManager
          customer={loginFor}
          profile={profileFor(loginFor.id)}
          onClose={() => setLoginFor(null)}
          onChanged={async (message) => {
            setLoginFor(null)
            setMsg(message)
            await load()
          }}
        />
      )}
    </div>
  )
}

function randomPassword() {
  const words = ['Sky', 'Oak', 'Blue', 'Star', 'Rain', 'Gold', 'Fox', 'Moon']
  const w = () => words[Math.floor(Math.random() * words.length)]
  return `${w()}${w()}${Math.floor(1000 + Math.random() * 9000)}`
}

function LoginManager({
  customer,
  profile,
  onClose,
  onChanged,
}: {
  customer: Customer
  profile: Profile | null
  onClose: () => void
  onChanged: (msg: string) => void
}) {
  const [email, setEmail] = useState(customer.email || '')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState(randomPassword())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function createLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }
    setBusy(true)
    setError('')
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: {
        action: 'create_customer_login',
        email: email.trim(),
        password,
        username: username.trim() || null,
        customer_id: customer.id,
        full_name: customer.contact_name || customer.name,
      },
    })
    setBusy(false)
    if (error || data?.error) {
      setError(data?.error || 'Could not create the login. The email may already be in use.')
      return
    }
    onChanged(
      `Login created for ${customer.name}. Username: ${username.trim() || email.trim()} · Password: ${password} — share these with your customer.`,
    )
  }

  async function resetPassword() {
    if (!profile) return
    const newPw = randomPassword()
    setBusy(true)
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'reset_password', user_id: profile.id, password: newPw },
    })
    setBusy(false)
    if (error || data?.error) {
      setError(data?.error || 'Could not reset the password.')
      return
    }
    onChanged(`New password for ${customer.name}: ${newPw} — share it with your customer.`)
  }

  async function removeLogin() {
    if (!profile) return
    if (!window.confirm(`Remove portal access for ${customer.name}?`)) return
    setBusy(true)
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'delete_login', user_id: profile.id },
    })
    setBusy(false)
    if (error || data?.error) {
      setError(data?.error || 'Could not remove the login.')
      return
    }
    onChanged(`Portal access removed for ${customer.name}.`)
  }

  return (
    <RetroModal title={`Portal login — ${customer.name}`} onClose={onClose}>
      {error && <div className="bevel-in mb-3 px-3 py-2 text-[12px] text-red-700">{error}</div>}
      {profile ? (
        <div className="space-y-3">
          <p className="text-[13px]">
            This customer can already sign in
            {profile.username ? (
              <>
                {' '}
                with username <b>{profile.username}</b>
              </>
            ) : null}
            .
          </p>
          <div className="flex flex-wrap gap-2">
            <button className={btnSecondary} onClick={resetPassword} disabled={busy}>
              Reset password
            </button>
            <button className={btnSecondary} onClick={removeLogin} disabled={busy}>
              Remove access
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[12px] text-[#4b4a44]">
            Create a login so this customer can see their invoices and raise tickets. They can sign in
            with the username <b>or</b> the email.
          </p>
          <label className="block">
            <span className={labelCls}>Email *</span>
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className={labelCls}>Username (optional, easier to remember)</span>
            <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. barbara" />
          </label>
          <label className="block">
            <span className={labelCls}>Temporary password</span>
            <div className="flex gap-2">
              <input className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
              <button className={btnSecondary} onClick={() => setPassword(randomPassword())} type="button">
                New
              </button>
            </div>
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button className={btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button className={btnPrimary} onClick={createLogin} disabled={busy}>
              {busy ? 'Creating…' : 'Create login'}
            </button>
          </div>
        </div>
      )}
    </RetroModal>
  )
}
