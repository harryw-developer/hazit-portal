import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'
import { btnPrimary, btnSecondary, inputCls, labelCls } from '../../lib/ui'
import type { Customer, Device } from '../../lib/types'

type Row = Device & { customer: { name: string } | null }

const blank = {
  customer_id: '',
  name: '',
  device_type: '',
  make_model: '',
  serial_number: '',
  location: '',
  purchase_date: '',
  warranty_until: '',
  notes: '',
}

export default function DevicesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<(typeof blank & { id?: string }) | null>(null)
  const [customerFilter, setCustomerFilter] = useState('')

  const load = useCallback(async () => {
    const [{ data }, { data: cs }] = await Promise.all([
      supabase.from('devices').select('*, customer:customers(name)').order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('name'),
    ])
    setRows((data as Row[]) || [])
    setCustomers((cs as Customer[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function save() {
    if (!editing || !editing.customer_id || !editing.name.trim()) return
    const { id, ...f } = editing
    const record = { ...f, purchase_date: f.purchase_date || null, warranty_until: f.warranty_until || null }
    if (id) await supabase.from('devices').update(record).eq('id', id)
    else await supabase.from('devices').insert(record)
    setEditing(null)
    await load()
  }
  async function remove(d: Row) {
    if (!window.confirm(`Delete ${d.name}?`)) return
    await supabase.from('devices').delete().eq('id', d.id)
    await load()
  }

  const visible = customerFilter ? rows.filter((r) => r.customer_id === customerFilter) : rows

  return (
    <div className="text-[13px]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-[#4b4a44]">Track each customer's equipment. Customers can see their own devices in the portal.</p>
        <div className="flex items-center gap-2">
          <select className={`${inputCls} !py-1`} value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
            <option value="">All customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button className={btnPrimary} onClick={() => setEditing({ ...blank })}>Add device…</button>
        </div>
      </div>

      <div className="bevel-in overflow-x-auto">
        <table className="tbl95 w-full min-w-[860px]">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Device</th>
              <th>Make / model</th>
              <th>Serial</th>
              <th>Warranty until</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="!p-6 text-center text-[#8a867a]">Loading…</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={6} className="!p-6 text-center text-[#8a867a]">No devices recorded.</td></tr>
            ) : (
              visible.map((d) => (
                <tr key={d.id} className="bg-white">
                  <td className="font-bold">{d.customer?.name || '—'}</td>
                  <td>{d.name}{d.device_type ? <div className="text-[11px] text-[#8a867a]">{d.device_type}</div> : null}</td>
                  <td>{d.make_model || '—'}</td>
                  <td className="font-mono text-[12px]">{d.serial_number || '—'}</td>
                  <td className="whitespace-nowrap">{d.warranty_until ? formatDate(d.warranty_until) : '—'}</td>
                  <td className="whitespace-nowrap text-right">
                    <button
                      className="link95 mr-2"
                      onClick={() =>
                        setEditing({
                          id: d.id,
                          customer_id: d.customer_id || '',
                          name: d.name,
                          device_type: d.device_type,
                          make_model: d.make_model,
                          serial_number: d.serial_number,
                          location: d.location,
                          purchase_date: d.purchase_date || '',
                          warranty_until: d.warranty_until || '',
                          notes: d.notes,
                        })
                      }
                    >
                      Edit
                    </button>
                    <button className="link95 text-red-600" onClick={() => remove(d)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="win-frame my-8 w-full max-w-lg">
            <div className="titlebar flex items-center justify-between px-2 py-1.5">
              <span className="text-[13px] font-bold text-white">{editing.id ? 'Edit device' : 'Add device'}</span>
              <button className="btn95 flex h-[22px] w-[24px] items-center justify-center !p-0 font-bold" onClick={() => setEditing(null)}>×</button>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className={labelCls}>Customer *</span>
                <select className={inputCls} value={editing.customer_id} onChange={(e) => setEditing({ ...editing, customer_id: e.target.value })}>
                  <option value="">— Select —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="block"><span className={labelCls}>Name *</span><input className={inputCls} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Reception PC" /></label>
              <label className="block"><span className={labelCls}>Type</span><input className={inputCls} value={editing.device_type} onChange={(e) => setEditing({ ...editing, device_type: e.target.value })} placeholder="Laptop / Router…" /></label>
              <label className="block"><span className={labelCls}>Make / model</span><input className={inputCls} value={editing.make_model} onChange={(e) => setEditing({ ...editing, make_model: e.target.value })} /></label>
              <label className="block"><span className={labelCls}>Serial number</span><input className={inputCls} value={editing.serial_number} onChange={(e) => setEditing({ ...editing, serial_number: e.target.value })} /></label>
              <label className="block"><span className={labelCls}>Location</span><input className={inputCls} value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></label>
              <label className="block"><span className={labelCls}>Purchase date</span><input className={inputCls} type="date" value={editing.purchase_date} onChange={(e) => setEditing({ ...editing, purchase_date: e.target.value })} /></label>
              <label className="block"><span className={labelCls}>Warranty until</span><input className={inputCls} type="date" value={editing.warranty_until} onChange={(e) => setEditing({ ...editing, warranty_until: e.target.value })} /></label>
              <label className="block sm:col-span-2"><span className={labelCls}>Notes</span><textarea className={inputCls} rows={2} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></label>
            </div>
            <div className="flex justify-end gap-2 p-4 pt-0">
              <button className={btnSecondary} onClick={() => setEditing(null)}>Cancel</button>
              <button className={btnPrimary} onClick={save} disabled={!editing.customer_id || !editing.name.trim()}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
