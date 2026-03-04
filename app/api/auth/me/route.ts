export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  return NextResponse.json({ user })
}

