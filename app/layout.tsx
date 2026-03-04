import './globals.css'
import type { ReactNode } from 'react'
import { DashboardShell } from './components/DashboardShell'

export const metadata = {
  title: 'OD Scheduler',
  description: 'Internal scheduling app'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="app">
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  )
}
