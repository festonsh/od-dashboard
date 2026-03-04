export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

const DEMO_USER_ID = 0

// Hardcoded super admin (in code only – for password recovery; hidden from dashboard)
const SUPER_ADMIN_PASSWORD = 'T7m$k9Qv2Lx4'
function isSuperAdminEmail(e: string) {
  const x = e.trim().toLowerCase()
  return x === 'superadmin' || x === 'superadmin@example.com' || x === 'superadmin@example.c'
}

// Vercel demo user: works without database (e.g. on Vercel with no DB)
const VERCEL_DEMO_EMAIL = 'demo@odetaa.com'
const DEFAULT_DEMO_PASSWORD = 'VercelDemo123!'
function getVercelDemoPassword() {
  const env = process.env.VERCEL_DEMO_PASSWORD
  if (typeof env === 'string' && env.trim()) return env.trim()
  return DEFAULT_DEMO_PASSWORD
}
function normalizeEmail(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\x00-\x1f\x7f-\uFFFF]/g, '')
}
function normalizePassword(s: string) {
  return s.trim().replace(/\s/g, '')
}
function isVercelDemoEmail(e: string) {
  return normalizeEmail(e) === VERCEL_DEMO_EMAIL
}

export async function POST(req: NextRequest) {
  let body: unknown = await req.json().catch(() => null)
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body) as unknown
    } catch {
      body = null
    }
  }
  if (!body || typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const b = body as Record<string, unknown>
  const email = typeof b.email === 'string' ? b.email : ''
  const password = typeof b.password === 'string' ? b.password : ''

  if (!email) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const pwd = normalizePassword(password)

  // Vercel demo user: no DB required. Accept default password always, or env override.
  const demoPwdOk =
    pwd === DEFAULT_DEMO_PASSWORD ||
    pwd === 'VercelDemo123' ||
    pwd === getVercelDemoPassword()
  if (isVercelDemoEmail(email) && demoPwdOk) {
    const res = NextResponse.json({
      user: { id: DEMO_USER_ID, name: 'Vercel Demo', email: VERCEL_DEMO_EMAIL, role: 'MANAGEMENT' }
    })
    const cookieValue = JSON.stringify({ id: DEMO_USER_ID, role: 'MANAGEMENT' })
    res.cookies.set('od_auth', cookieValue, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    })
    return res
  }

  const { prisma } = await import('../../../../lib/prisma')
  const { setAuthCookie, verifyPassword, hashPassword } = await import('../../../../lib/auth')
  const { SUPER_ADMIN_EMAIL_CANONICAL } = await import('../../../../lib/super-admin')

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

