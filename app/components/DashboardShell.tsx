'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type User = { id: number; name: string; role: string } | null

export function DashboardShell({ children }: { children: React.ReactNode }) {
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

  const isLoginPage = pathname === '/login'

  if (!mounted) {
    return <main className="main">{children}</main>
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link href={user?.role === 'MANAGEMENT' ? '/management/dashboard' : '/my-schedule'} className="logo">
          OD Scheduler
        </Link>
        <nav>
          {user?.role === 'MANAGEMENT' && (
            <>
              <Link
                href="/management/dashboard"
                className={pathname === '/management/dashboard' ? 'active' : undefined}
              >
                Dashboard
              </Link>
              <Link
                href="/management/projects"
                className={pathname === '/management/projects' ? 'active' : undefined}
              >
                Add project
              </Link>
              <Link
                href="/management/schedule"
                className={pathname === '/management/schedule' ? 'active' : undefined}
              >
                Assign schedule
              </Link>
              <Link
                href="/management/employees"
                className={pathname === '/management/employees' ? 'active' : undefined}
              >
                Users
              </Link>
            </>
          )}
          <Link
            href="/my-schedule"
            className={pathname === '/my-schedule' ? 'active' : undefined}
          >
            My schedule
          </Link>
        </nav>
        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{user.name}</p>
              <p className="sidebar-user-position">
                {user.role === 'MANAGEMENT' ? 'Admin' : 'Employee'}
              </p>
            </div>
          )}
          <form action="/api/auth/logout" method="post">
            <button className="logout" type="submit">
              Logout
            </button>
          </form>
        </div>
      </aside>
      <main className="dashboard-main">{children}</main>
    </div>
  )
}
