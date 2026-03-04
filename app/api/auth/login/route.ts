export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

// Hardcoded super admin (in code directly)
const SUPER_ADMIN_PASSWORD = 'T7m$k9Qv2Lx4'
const SUPER_ADMIN_EMAIL_CANONICAL = 'superadmin@example.com'
function isSuperAdminEmail(e: string) {
  const x = e.trim().toLowerCase()
  return x === 'superadmin' || x === 'superadmin@example.com' || x === 'superadmin@example.c'
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { email, password } = body as { email: string; password: string }

  const { prisma } = await import('../../../../lib/prisma')
  const { setAuthCookie, verifyPassword, hashPassword } = await import('../../../../lib/auth')

  // Hardcoded super admin: if credentials match, find or create and log in
  if (isSuperAdminEmail(email) && password === SUPER_ADMIN_PASSWORD) {
    let superUser = await prisma.user.findUnique({ where: { email: SUPER_ADMIN_EMAIL_CANONICAL } })
    if (!superUser) {
      const passwordHash = await hashPassword(SUPER_ADMIN_PASSWORD)
      superUser = await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: SUPER_ADMIN_EMAIL_CANONICAL,
          role: 'MANAGEMENT',
          passwordHash
        }
      })
    }
    setAuthCookie({ id: superUser.id, role: superUser.role })
    return NextResponse.json({
      user: { id: superUser.id, name: superUser.name, email: superUser.email, role: superUser.role }
    })
  }

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

