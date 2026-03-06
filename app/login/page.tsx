'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { BrandLogo } from '../components/BrandLogo'

function LoginForm() {
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
      const target = from || (data.user?.role === 'MANAGEMENT' ? '/management/dashboard' : '/my-schedule')
      // Full page load so layout is re-rendered with auth cookie (sidebar shows correctly)
      window.location.href = target
      return
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page login-page--light">
      <form className="login-card login-card--light" onSubmit={onSubmit}>
        <div className="login-title">
          <BrandLogo className="brand-logo--login" />
        </div>

        <div className="login-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="login-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" disabled={loading} className="login-submit">
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

