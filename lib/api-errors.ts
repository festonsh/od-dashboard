import { NextResponse } from 'next/server'

export function apiErrorResponse(error: unknown, fallbackMessage = 'Request failed.') {
  if (error instanceof Error) {
    if (error.message === 'Unauthenticated') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ error: error.message || fallbackMessage }, { status: 500 })
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 })
}
