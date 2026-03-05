import './globals.css'
import type { ReactNode } from 'react'
import { DashboardShell } from './components/DashboardShell'
import { getCurrentUser } from '../lib/auth'

export const metadata = {
  title: 'OD Scheduler',
  description: 'Internal scheduling app'
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  return (
    <html lang="en">
      <body className="app">
        <DashboardShell initialUser={user}>{children}</DashboardShell>
      </body>
    </html>
  )
}
