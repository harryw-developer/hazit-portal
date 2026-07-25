import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Profile } from './types'

interface AuthCtx {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (identifier: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({
  session: null,
  profile: null,
  loading: true,
  signIn: async () => 'not ready',
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile((data as Profile) ?? null)
  }

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session) await loadProfile(data.session.user.id)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) void loadProfile(s.user.id)
      else setProfile(null)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Accept either an email or a username; resolve to the account email, then sign in.
  async function signIn(identifier: string, password: string): Promise<string | null> {
    const id = identifier.trim()
    if (!id || !password) return 'Please enter your username/email and password.'
    let email = id
    if (!id.includes('@')) {
      const { data, error } = await supabase.rpc('resolve_login_email', { identifier: id })
      if (error) return 'Could not sign you in. Please try again.'
      if (!data) return 'We could not find that username.'
      email = data as string
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('banned') || msg.includes('disabled')) {
        return 'This account has been disabled. Please contact us for help.'
      }
      return 'Wrong username/email or password. Please try again.'
    }
    return null
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  async function refreshProfile() {
    if (session) await loadProfile(session.user.id)
  }

  return (
    <Ctx.Provider value={{ session, profile, loading, signIn, signOut, refreshProfile }}>
      {children}
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(Ctx)
}
