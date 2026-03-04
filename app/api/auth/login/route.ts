export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { setAuthCookie, verifyPassword, hashPassword } from '../../../../lib/auth'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { email, password } = body as { email: string; password: string }

  let user = await prisma.user.findUnique({ where: { email } })

  // Lazy seed: if no management user exists at all, create one using provided credentials
  const managementCount = await prisma.user.count({ where: { role: 'MANAGEMENT' } })
  if (!managementCount) {
    const passwordHash = await hashPassword(password)
    user = await prisma.user.create({
      data: {
        name: 'Admin',
        email,
        role: 'MANAGEMENT',
        passwordHash
      }
    })
  }

  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  setAuthCookie({ id: user.id, role: user.role })

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  })
}

