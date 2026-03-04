import { cookies } from 'next/headers'

const AUTH_COOKIE = 'od_auth'

export function setAuthCookie(user: { id: number; role: string }) {
  const value = JSON.stringify({ id: user.id, role: user.role })
  cookies().set(AUTH_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })
}

export function clearAuthCookie() {
  cookies().delete(AUTH_COOKIE)
}
