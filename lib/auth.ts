import { cookies } from 'next/headers'
import * as bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { setAuthCookie as setAuthCookieImpl, clearAuthCookie as clearAuthCookieImpl } from './auth-cookies'

const AUTH_COOKIE = 'od_auth'

/** Sentinel id for hardcoded Vercel demo user (no DB required) */
export const DEMO_USER_ID = 0

const DEMO_USER = {
  id: DEMO_USER_ID,
  name: 'Vercel Demo',
  email: 'demo@odetaa.com',
  role: 'MANAGEMENT' as const
}

export const setAuthCookie = setAuthCookieImpl
export const clearAuthCookie = clearAuthCookieImpl

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function getCurrentUser() {
  const raw = cookies().get(AUTH_COOKIE)?.value
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as { id: number; role?: string }
    if (parsed?.id === DEMO_USER_ID) return DEMO_USER
    if (!parsed?.id) return null
    return prisma.user.findUnique({
      where: { id: parsed.id },
      select: { id: true, name: true, email: true, role: true }
    })
  } catch {
    return null
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthenticated')
  }
  return user
}

export async function requireManagementUser() {
  const user = await requireCurrentUser()
  if (user.role !== 'MANAGEMENT') {
    throw new Error('Forbidden')
  }
  return user
}


