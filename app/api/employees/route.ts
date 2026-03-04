export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const { prisma } = await import('../../../lib/prisma')
  const { requireManagementUser } = await import('../../../lib/auth')
  await requireManagementUser()
  const employees = await prisma.user.findMany({
    orderBy: { name: 'asc' }
  })
  return NextResponse.json({ employees })
}

export async function POST(req: NextRequest) {
  const { prisma, requireManagementUser, hashPassword } = await (async () => {
    const [p, a] = await Promise.all([
      import('../../../lib/prisma'),
      import('../../../lib/auth')
    ])
    return { prisma: p.prisma, requireManagementUser: a.requireManagementUser, hashPassword: a.hashPassword }
  })()
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
    const updateData: {
      name: string
      email: string
      role: 'EMPLOYEE' | 'MANAGEMENT'
      phone: string | null
      trade: string | null
      defaultLocation: string | null
      passwordHash?: string
    } = {
      ...rest,
      phone: rest.phone || null,
      trade: rest.trade || null,
      defaultLocation: rest.defaultLocation || null
    }
    if (password && password.length >= 6) {
      updateData.passwordHash = await hashPassword(password)
    }
    const employee = await prisma.user.update({
      where: { id },
      data: updateData
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

