import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'
import type { Settings } from './types'

interface SettingsCtx {
  settings: Settings | null
  loading: boolean
  refresh: () => Promise<void>
}

const Ctx = createContext<SettingsCtx>({ settings: null, loading: true, refresh: async () => {} })

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const { data } = await supabase.from('settings').select('*').eq('id', 1).single()
    if (data) setSettings(data as Settings)
    setLoading(false)
  }, [])

  // Settings are readable only once signed in (RLS), so fetch after auth.
  useEffect(() => {
    if (session) void refresh()
    else {
      setSettings(null)
      setLoading(false)
    }
  }, [session, refresh])

  return <Ctx.Provider value={{ settings, loading, refresh }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  return useContext(Ctx)
}
