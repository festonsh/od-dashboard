'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        setError('Invalid email or password.')
        return
      }
      const data = await res.json()
      const from = searchParams.get('from')
      if (data.user?.role === 'MANAGEMENT') {
        router.push(from || '/management/dashboard')
      } else {
        router.push(from || '/my-schedule')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page login-page--light">
      <form className="login-card login-card--light" onSubmit={onSubmit}>
        <h1 className="login-title">OD Scheduler</h1>

        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder=""
            autoComplete="current-password"
            required
          />
        </label>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        {error && <p className="login-error">{error}</p>}
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-page login-page--light"><div className="login-card login-card--light">Loading…</div></div>}>
      <LoginForm />
    </Suspense>
  )
}

