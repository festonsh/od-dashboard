import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '../../lib/auth'

export default async function ManagementLayout({
  children
}: {
  children: ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) redirect('/login')
  if (user.role !== 'MANAGEMENT') redirect('/my-schedule')

  return <>{children}</>
}
