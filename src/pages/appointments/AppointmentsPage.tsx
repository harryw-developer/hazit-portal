import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'
import { btnPrimary, inputCls, labelCls } from '../../lib/ui'
import type { Appointment, AppointmentStatus, Customer } from '../../lib/types'

type Row = Appointment & { customer: { name: string } | null }

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  requested: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-indigo-100 text-indigo-800',
  cancelled: 'bg-gray-200 text-gray-600',
}

export default function AppointmentsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ customer_id: '', service: '', preferred_date: '', preferred_time: '', location: '', notes: '' })

  const load = useCallback(async () => {
    const [{ data }, { data: cs }] = await Promise.all([
      supabase.from('appointments').select('*, customer:customers(name)').order('preferred_date', { nullsFirst: false }),
      supabase.from('customers').select('*').order('name'),
    ])
    setRows((data as Row[]) || [])
    setCustomers((cs as Customer[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function setStatus(a: Row, status: AppointmentStatus) {
    await supabase.from('appointments').update({ status }).eq('id', a.id)
    await load()
  }
  async function saveNote(a: Row, staff_notes: string) {
    await supabase.from('appointments').update({ staff_notes }).eq('id', a.id)
  }
  async function addAppt() {
    if (!form.customer_id || !form.service.trim()) return
    await supabase.from('appointments').insert({
      customer_id: form.customer_id,
      service: form.service,
      preferred_date: form.preferred_date || null,
      preferred_time: form.preferred_time,
      location: form.location,
      notes: form.notes,
      status: 'confirmed',
    })
    setAdding(false)
    setForm({ customer_id: '', service: '', preferred_date: '', preferred_time: '', location: '', notes: '' })
    await load()
  }

  return (
    <div className="text-[13px]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] text-[#4b4a44]">
          Visit &amp; call requests from customers. Confirm a time, then mark complete afterwards.
        </p>
        <button className={btnPrimary} onClick={() => setAdding((v) => !v)}>
          {adding ? 'Close' : 'Book appointment…'}
        </button>
      </div>

      {adding && (
        <fieldset className="groupbox mb-3">
          <legend>New appointment</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className={labelCls}>Customer</span>
              <select className={inputCls} value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
                <option value="">— Select —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Service</span>
              <input className={inputCls} value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} placeholder="On-site visit" />
            </label>
            <label className="block">
              <span className={labelCls}>Location</span>
              <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </label>
            <label className="block">
              <span className={labelCls}>Date</span>
              <input className={inputCls} type="date" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} />
            </label>
            <label className="block">
              <span className={labelCls}>Time</span>
              <input className={inputCls} value={form.preferred_time} onChange={(e) => setForm({ ...form, preferred_time: e.target.value })} placeholder="e.g. 2pm" />
            </label>
          </div>
          <div className="mt-3 flex justify-end">
            <button className={btnPrimary} onClick={addAppt}>Save</button>
          </div>
        </fieldset>
      )}

      <div className="bevel-in overflow-x-auto">
        <table className="tbl95 w-full min-w-[820px]">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Service</th>
              <th>When</th>
              <th>Status</th>
              <th>Staff notes</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="!p-6 text-center text-[#8a867a]">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="!p-6 text-center text-[#8a867a]">No appointments yet.</td></tr>
            ) : (
              rows.map((a) => (
                <tr key={a.id} className="bg-white">
                  <td className="font-bold">{a.customer?.name || '—'}</td>
                  <td>{a.service}{a.location ? ` · ${a.location}` : ''}{a.notes ? <div className="text-[11px] text-[#8a867a]">{a.notes}</div> : null}</td>
                  <td className="whitespace-nowrap">{a.preferred_date ? formatDate(a.preferred_date) : 'Any'}{a.preferred_time ? ` · ${a.preferred_time}` : ''}</td>
                  <td>
                    <span className={`rounded px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_COLOR[a.status]}`}>{a.status}</span>
                  </td>
                  <td>
                    <input
                      className={`${inputCls} !py-0.5 text-[12px]`}
                      defaultValue={a.staff_notes}
                      onBlur={(e) => saveNote(a, e.target.value)}
                      placeholder="Add note…"
                    />
                  </td>
                  <td className="whitespace-nowrap text-right">
                    {a.status === 'requested' && <button className="link95 mr-2 text-green-700" onClick={() => setStatus(a, 'confirmed')}>Confirm</button>}
                    {(a.status === 'requested' || a.status === 'confirmed') && <button className="link95 mr-2" onClick={() => setStatus(a, 'completed')}>Complete</button>}
                    {a.status !== 'cancelled' && a.status !== 'completed' && <button className="link95 text-red-600" onClick={() => setStatus(a, 'cancelled')}>Cancel</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
