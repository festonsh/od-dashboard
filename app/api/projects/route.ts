export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { requireManagementUser } from '../../../lib/auth'

export async function GET(req: NextRequest) {
  await requireManagementUser()
  const status = req.nextUrl.searchParams.get('status') || 'ACTIVE'

  const projects = await prisma.project.findMany({
    where: status && status !== 'ALL' ? { status } : undefined,
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ projects })
}

export async function POST(req: NextRequest) {
  await requireManagementUser()
  const body = (await req.json().catch(() => null)) as
    | {
        id?: number
        name: string
        description?: string | null
        customer?: string | null
        contact?: string | null
        address: string
        startDate?: string | null
        endDate?: string | null
        notes?: string | null
        status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'ARCHIVED'
      }
    | null

  if (!body || !body.name || !body.address) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { id, startDate, endDate, ...rest } = body

  const data = {
    ...rest,
    description: rest.description || null,
    customer: rest.customer || null,
    contact: rest.contact || null,
    notes: rest.notes || null,
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null
  }

  const project = id
    ? await prisma.project.update({ where: { id }, data })
    : await prisma.project.create({ data })

  return NextResponse.json({ project })
}

