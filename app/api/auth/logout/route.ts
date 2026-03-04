export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { clearAuthCookie } = await import('../../../../lib/auth-cookies')
  clearAuthCookie()
  return NextResponse.redirect(new URL('/login', req.url))
}

