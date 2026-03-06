import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '../../lib/auth'

export default async function MyScheduleLayout({
  children
}: {
  children: ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) redirect('/login')

  return <>{children}</>
}
