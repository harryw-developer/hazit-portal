import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

const LOGO_URL =
  'https://lgxwgsiehprplflawjqd.supabase.co/storage/v1/object/public/branding/haz-it-logo.png'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const err = await signIn(identifier, password)
    if (err) {
      setError(err)
      setBusy(false)
    }
    // On success the auth listener swaps the whole app over.
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <img src={LOGO_URL} alt="HazIT" className="h-20 w-auto object-contain" />
          <p className="mt-3 text-center text-lg text-slate-600">Welcome — please sign in</p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
        >
          <label className="block">
            <span className="mb-1.5 block text-base font-semibold text-slate-700">
              Username or email
            </span>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              autoFocus
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 focus:border-blue-500 focus:outline-none"
              placeholder="e.g. barbara"
            />
          </label>

          <label className="mt-5 block">
            <span className="mb-1.5 block text-base font-semibold text-slate-700">Password</span>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 pr-24 text-lg text-slate-900 focus:border-blue-500 focus:outline-none"
                placeholder="Your password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-50"
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3.5 text-lg font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="mt-5 text-center text-sm text-slate-500">
            Trouble signing in? Call us and we'll help you straight away.
          </p>
        </form>
      </div>
    </div>
  )
}
