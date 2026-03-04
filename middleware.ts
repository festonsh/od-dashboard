import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  const raw = req.cookies.get('od_auth')?.value
  const user = raw ? (JSON.parse(raw) as { id: number; role: string }) : null

  if (!user && !pathname.startsWith('/api')) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/management') && user?.role !== 'MANAGEMENT') {
    const url = req.nextUrl.clone()
    url.pathname = '/my-schedule'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}

