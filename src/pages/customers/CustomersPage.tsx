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

  async function deleteCustomer(c: Customer) {
    if (
      !window.confirm(
        `Permanently delete ${c.name}?\n\nThis removes their portal login, tickets, appointments and devices, and unlinks their invoices/quotes. This cannot be undone.`,
      )
    )
      return
    const { error } = await supabase.rpc('delete_customer', { p_customer_id: c.id })
    if (error) {
      setMsg(`Could not delete: ${error.message}`)
      return
    }
    setMsg(`${c.name} deleted.`)
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
                        prof.login_disabled ? (
                          <span className="text-red-700">⊘ {prof.username || 'disabled'} (disabled)</span>
                        ) : (
                          <span className="text-green-700">✓ {prof.username || 'enabled'}</span>
                        )
                      ) : (
                        <span className="text-[#8a867a]">none</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-right">
                      <button className="link95 mr-3" onClick={() => setEditing({ ...c })}>
                        Edit
                      </button>
                      <button className="link95 mr-3" onClick={() => setLoginFor(c)}>
                        {prof ? 'Manage login' : 'Create login'}
                      </button>
                      <button className="link95 text-red-600" onClick={() => deleteCustomer(c)}>
                        Delete
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
          key={loginFor.id}
          customer={loginFor}
          profile={profileFor(loginFor.id)}
          onClose={() => setLoginFor(null)}
          onRefresh={load}
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

// Calls the manage-users edge function, retrying once (the admin API very
// occasionally returns a transient JWT error).
async function callManageUsers(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await supabase.functions.invoke('manage-users', { body })
    if (!error && !data?.error) return { ok: true }
    if (attempt === 1) return { ok: false, error: (data?.error as string) || error?.message || 'Request failed' }
    await new Promise((r) => setTimeout(r, 700))
  }
  return { ok: false, error: 'Request failed' }
}

function LoginManager({
  customer,
  profile,
  onClose,
  onChanged,
  onRefresh,
}: {
  customer: Customer
  profile: Profile | null
  onClose: () => void
  onChanged: (msg: string) => void
  onRefresh: () => Promise<void>
}) {
  const [email, setEmail] = useState(customer.email || '')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState(randomPassword())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [storedPw, setStoredPw] = useState(profile?.shared_password || '')
  const [showPw, setShowPw] = useState(false)
  const [newPw, setNewPw] = useState(randomPassword())
  const [mode, setMode] = useState(profile?.portal_mode || 'easy')
  const [disabled, setDisabled] = useState(profile?.login_disabled || false)

  // Keep the dialog in step with the latest saved data
  useEffect(() => {
    setDisabled(profile?.login_disabled || false)
    setMode(profile?.portal_mode || 'easy')
    setStoredPw(profile?.shared_password || '')
  }, [profile])

  async function createLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }
    setBusy(true)
    setError('')
    const res = await callManageUsers({
      action: 'create_customer_login',
      email: email.trim(),
      password,
      username: username.trim() || null,
      customer_id: customer.id,
      full_name: customer.contact_name || customer.name,
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error || 'Could not create the login. The email may already be in use.')
      return
    }
    onChanged(
      `Login created for ${customer.name}. Username: ${username.trim() || email.trim()} · Password: ${password} — share these with your customer.`,
    )
  }

  async function resetPassword() {
    if (!profile || !newPw.trim()) return
    if (newPw.trim().length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    // Sets the password directly in the database (staff-only RPC) — reliable,
    // unlike the occasionally-flaky auth admin API.
    const { error } = await supabase.rpc('set_customer_password', {
      p_user_id: profile.id,
      p_password: newPw,
    })
    setBusy(false)
    if (error) {
      setError(error.message || 'Could not set the password.')
      return
    }
    setStoredPw(newPw)
    setShowPw(true)
    setNotice(`Password updated. New password: ${newPw}`)
    await onRefresh()
  }

  async function setPortalMode(next: 'easy' | 'standard') {
    if (!profile) return
    setMode(next)
    await supabase.from('profiles').update({ portal_mode: next }).eq('id', profile.id)
    setNotice(next === 'easy' ? 'Set to Easy (large) mode.' : 'Set to Standard mode.')
    await onRefresh()
  }

  async function toggleDisabled() {
    if (!profile) return
    const next = !disabled
    setBusy(true)
    setError('')
    setNotice('')
    const { error } = await supabase.rpc('set_login_disabled', { p_user_id: profile.id, p_disabled: next })
    setBusy(false)
    if (error) {
      setError(error.message || 'Could not update the login.')
      return
    }
    setDisabled(next)
    setNotice(next ? 'Login disabled — this customer can no longer sign in.' : 'Login enabled — this customer can sign in again.')
    await onRefresh()
  }

  async function removeLogin() {
    if (!profile) return
    if (!window.confirm(`Remove portal access for ${customer.name}? They will no longer be able to sign in, but their invoices and history stay.`)) return
    setBusy(true)
    setError('')
    // Reliable staff-only RPC (avoids the flaky auth admin API)
    const { error } = await supabase.rpc('delete_customer_login', { p_user_id: profile.id })
    setBusy(false)
    if (error) {
      setError(error.message || 'Could not remove the login.')
      return
    }
    onChanged(`Portal access removed for ${customer.name}.`)
  }

  return (
    <RetroModal title={`Portal login — ${customer.name}`} onClose={onClose}>
      {error && <div className="bevel-in mb-3 px-3 py-2 text-[12px] text-red-700">{error}</div>}
      {notice && <div className="bevel-in mb-3 px-3 py-2 text-[12px] text-green-800">{notice}</div>}
      {profile ? (
        <div className="space-y-4">
          <div className="text-[13px]">
            Signs in with{' '}
            <b>{profile.username || email || 'their email'}</b>.
          </div>

          <fieldset className="groupbox">
            <legend>Current password</legend>
            {storedPw ? (
              <div className="flex items-center gap-2">
                <input className={inputCls} readOnly value={showPw ? storedPw : '••••••••'} />
                <button className={btnSecondary} type="button" onClick={() => setShowPw((v) => !v)}>
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            ) : (
              <p className="text-[12px] text-[#4b4a44]">
                Not recorded (set before this feature). Set a new one below to make it viewable.
              </p>
            )}
          </fieldset>

          <fieldset className="groupbox">
            <legend>Set a new password</legend>
            <div className="flex gap-2">
              <input className={inputCls} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Type any password" />
              <button className={btnSecondary} type="button" onClick={() => setNewPw(randomPassword())}>
                Suggest
              </button>
              <button className={btnPrimary} onClick={resetPassword} disabled={busy || !newPw.trim()}>
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </fieldset>

          <fieldset className="groupbox">
            <legend>Portal display mode</legend>
            <div className="flex gap-2">
              <button className={`btn95 ${mode === 'easy' ? 'pressed' : ''}`} onClick={() => setPortalMode('easy')}>
                Easy (large text)
              </button>
              <button className={`btn95 ${mode === 'standard' ? 'pressed' : ''}`} onClick={() => setPortalMode('standard')}>
                Standard dashboard
              </button>
            </div>
            <p className="mt-2 text-[12px] text-[#4b4a44]">
              Easy mode is bigger and simpler (great for less confident users). Standard is a normal, compact dashboard.
            </p>
          </fieldset>

          <fieldset className="groupbox">
            <legend>Access</legend>
            <div className="flex items-center gap-2">
              <span className={`text-[12px] font-bold ${disabled ? 'text-red-700' : 'text-green-700'}`}>
                {disabled ? '● Disabled — cannot sign in' : '● Active'}
              </span>
              <div className="flex-1" />
              <button className={btnSecondary} onClick={toggleDisabled} disabled={busy}>
                {disabled ? 'Enable login' : 'Disable login'}
              </button>
              <button className={btnSecondary} onClick={removeLogin} disabled={busy}>
                Remove access
              </button>
            </div>
            <p className="mt-2 text-[12px] text-[#4b4a44]">
              Disable temporarily blocks sign-in (reversible). Remove deletes the login entirely.
            </p>
          </fieldset>
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
