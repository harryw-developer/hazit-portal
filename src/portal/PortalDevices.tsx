import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/format'
import type { Device } from '../lib/types'
import { BackBar, EmptyState, PageHeading, PortalCard } from './ui'

export default function PortalDevices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from('devices').select('*').order('name')
      setDevices((data as Device[]) || [])
      setLoading(false)
    })()
  }, [])

  return (
    <div>
      <BackBar />
      <PageHeading emoji="💻">My Devices</PageHeading>
      <p className="mb-6 text-lg text-slate-600">
        This is the equipment we look after for you. If something is missing or wrong, let us know.
      </p>

      {loading ? (
        <p className="text-xl text-slate-500">Loading…</p>
      ) : devices.length === 0 ? (
        <EmptyState emoji="💻" title="No devices recorded yet" hint="We'll add your equipment here as we help you." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {devices.map((d) => (
            <PortalCard key={d.id}>
              <div className="text-xl font-bold text-slate-900">{d.name}</div>
              {d.device_type && <div className="text-lg text-slate-500">{d.device_type}</div>}
              <dl className="mt-3 space-y-1 text-base text-slate-600">
                {d.make_model && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-400">Make / model</dt>
                    <dd className="text-right font-medium">{d.make_model}</dd>
                  </div>
                )}
                {d.location && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-400">Where</dt>
                    <dd className="text-right font-medium">{d.location}</dd>
                  </div>
                )}
                {d.warranty_until && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-400">Warranty until</dt>
                    <dd className="text-right font-medium">{formatDate(d.warranty_until)}</dd>
                  </div>
                )}
              </dl>
            </PortalCard>
          ))}
        </div>
      )}
    </div>
  )
}
