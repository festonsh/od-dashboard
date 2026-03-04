export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { prisma } = await import('../../../../lib/prisma')
  const { requireManagementUser } = await import('../../../../lib/auth')
  await requireManagementUser()

  const { id } = await params
  const idNum = Number(id)
  if (!id || Number.isNaN(idNum)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const fromParam = req.nextUrl.searchParams.get('from') || ''
  const toParam = req.nextUrl.searchParams.get('to') || ''
  const from = fromParam ? new Date(fromParam) : null
  const to = toParam ? new Date(toParam) : null

  const user = await prisma.user.findUnique({
    where: { id: idNum },
    select: { id: true, name: true, email: true, role: true, phone: true, trade: true, defaultLocation: true }
  })

  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const where: { userId: number; date?: { gte?: Date; lte?: Date } } = { userId: idNum }
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = from
    if (to) where.date.lte = to
  }

  const assignments = await prisma.assignment.findMany({
    where,
    include: { project: true },
    orderBy: { date: 'asc' }
  })

  return NextResponse.json({
    employee: user,
    assignments: assignments.map((a) => ({
      id: a.id,
      date: a.date.toISOString().slice(0, 10),
      type: a.type,
      projectId: a.projectId,
      projectName: a.project?.name ?? null,
      address: a.project?.address ?? null,
      startTime: a.startTime,
      endTime: a.endTime,
      workType: a.workType,
      meetingPoint: a.meetingPoint,
      notes: a.notes
    }))
  })
}
