import './globals.css'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { prisma } from '../lib/prisma'

export const metadata = {
  title: 'OD Scheduler',
  description: 'Internal scheduling app'
}

async function getCurrentUser() {
  const cookie = cookies().get('od_auth')?.value
  if (!cookie) return null
  try {
    const parsed = JSON.parse(cookie) as { id: number }
    if (!parsed?.id) return null
    const user = await prisma.user.findUnique({
      where: { id: parsed.id },
      select: { id: true, name: true, role: true }
    })
    return user
  } catch {
    return null
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()

  return (
    <html lang="en">
      <body className="app">
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
          ) : (
            <Link href="/login">Log in</Link>
          )}
        </header>
        <main className="main">{children}</main>
      </body>
    </html>
  )
}

