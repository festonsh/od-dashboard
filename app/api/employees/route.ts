export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { requireManagementUser, hashPassword } from '../../../lib/auth'

export async function GET() {
  await requireManagementUser()
  const employees = await prisma.user.findMany({
    orderBy: { name: 'asc' }
  })
  return NextResponse.json({ employees })
}

export async function POST(req: NextRequest) {
  await requireManagementUser()
  const body = (await req.json().catch(() => null)) as
    | {
        id?: number
        name: string
        email: string
        role: 'EMPLOYEE' | 'MANAGEMENT'
        phone?: string | null
        trade?: string | null
        defaultLocation?: string | null
        password?: string
      }
    | null

  if (!body || !body.name || !body.email || !body.role) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { id, password, ...rest } = body

  if (id) {
    const employee = await prisma.user.update({
      where: { id },
      data: {
        ...rest,
        phone: rest.phone || null,
        trade: rest.trade || null,
        defaultLocation: rest.defaultLocation || null
      }
    })
    return NextResponse.json({ employee })
  }

  const passwordHash = await hashPassword(
    password && password.length >= 6 ? password : Math.random().toString(36).slice(2, 10)
  )

  const employee = await prisma.user.create({
    data: {
      ...rest,
      phone: rest.phone || null,
      trade: rest.trade || null,
      defaultLocation: rest.defaultLocation || null,
      passwordHash
    }
  })

  return NextResponse.json({ employee })
}

