export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function GET() {
  const { getCurrentUser } = await import('../../../../lib/auth')
  const user = await getCurrentUser()
  return NextResponse.json({ user })
}

