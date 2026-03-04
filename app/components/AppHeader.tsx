'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type User = { id: number; name: string; role: string } | null

export function AppHeader() {
  const pathname = usePathname()
  const [user, setUser] = useState<User>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null))
  }, [])

  if (!mounted) {
    return (
      <header className="topbar">
        <Link href="/" className="logo">
          OD Scheduler
        </Link>
        <div className="spacer" />
        <span className="nav" style={{ opacity: 0.6 }}>Loading…</span>
      </header>
    )
  }

  return (
    <header className="topbar">
      <Link href="/" className="logo">
        OD Scheduler
      </Link>
      <div className="spacer" />
      {user ? (
        <nav className="nav">
          <Link href="/my-schedule">My schedule</Link>
          {user.role === 'MANAGEMENT' && (
            <>
              <Link href="/management/schedule">Schedule</Link>
              <Link href="/management/projects">Projects</Link>
              <Link href="/management/employees">Employees</Link>
            </>
          )}
          <form action="/api/auth/logout" method="post">
            <button className="logout" type="submit">
              Log out
            </button>
          </form>
        </nav>
      ) : pathname !== '/login' ? (
        <Link href="/login">Log in</Link>
      ) : null}
    </header>
  )
}
