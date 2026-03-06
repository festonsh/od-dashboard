export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { format } from 'date-fns'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { prisma } = await import('../../../../lib/prisma')
  const { requireManagementUser } = await import('../../../../lib/auth')
  const { sendAssignmentNotification } = await import('../../../../lib/email')
  await requireManagementUser()
  const body = (await req.json().catch(() => null)) as
    | {
        employeeId: number
        date: string
        projectId: number | null
        type: 'DEFAULT' | 'OVERRIDE'
        startTime?: string | null
        endTime?: string | null
        workType?: string | null
        meetingPoint?: string | null
        notes?: string | null
      }
    | null

  if (!body || !body.employeeId || !body.date) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const dayStr = body.date.trim().slice(0, 10)
  const todayStr = new Date().toISOString().slice(0, 10)
  if (dayStr < todayStr) {
    return NextResponse.json({ error: 'Cannot assign to a past date' }, { status: 400 })
  }

  if (!body.projectId || body.projectId < 1) {
    return NextResponse.json({ error: 'Project is required' }, { status: 400 })
  }
  if (!body.startTime?.trim()) {
    return NextResponse.json({ error: 'Start time is required' }, { status: 400 })
  }
  if (!body.endTime?.trim()) {
    return NextResponse.json({ error: 'End time is required' }, { status: 400 })
  }

  const { employeeId, date, projectId, type, ...rest } = body
  const day = new Date(date)

  if (type === 'OVERRIDE') {
    await prisma.assignment.deleteMany({
      where: {
        userId: employeeId,
        type: 'OVERRIDE',
        date: {
          gte: day,
          lt: new Date(day.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    })
  }

  const existingDefault = await prisma.assignment.findFirst({
    where: {
      userId: employeeId,
      type: 'DEFAULT',
      date: {
        gte: day,
        lt: new Date(day.getTime() + 24 * 60 * 60 * 1000)
      }
    }
  })

  let assignment
  if (existingDefault && type === 'DEFAULT') {
    assignment = await prisma.assignment.update({
      where: { id: existingDefault.id },
      data: {
        projectId: projectId ?? null,
        ...rest
      }
    })
  } else {
    assignment = await prisma.assignment.create({
      data: {
        userId: employeeId,
        date: day,
        type,
        projectId: projectId ?? null,
        ...rest
      }
    })
  }

  const assignmentWithRelations = await prisma.assignment.findUnique({
    where: { id: assignment.id },
    include: { user: { select: { email: true, name: true } }, project: true }
  })
  if (assignmentWithRelations?.user?.email) {
    const projectName = assignmentWithRelations.project?.name ?? 'Assignment'
    await sendAssignmentNotification({
      to: assignmentWithRelations.user.email,
      employeeName: assignmentWithRelations.user.name ?? 'there',
      projectName,
      date: format(day, 'EEE, MMM d, yyyy'),
      startTime: assignmentWithRelations.startTime ?? rest.startTime ?? null,
      endTime: assignmentWithRelations.endTime ?? rest.endTime ?? null,
      workType: assignmentWithRelations.workType ?? rest.workType ?? null,
      meetingPoint: assignmentWithRelations.meetingPoint ?? rest.meetingPoint ?? null,
      notes: assignmentWithRelations.notes ?? rest.notes ?? null
    })
  }

  return NextResponse.json({ assignment })
}

