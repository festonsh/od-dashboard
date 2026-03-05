export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { addDays, differenceInDays } from 'date-fns'

type AssignmentPayload = {
  projectId: number | null
  type: 'DEFAULT' | 'OVERRIDE'
  startTime?: string | null
  endTime?: string | null
  workType?: string | null
  meetingPoint?: string | null
  notes?: string | null
}

export async function POST(req: NextRequest) {
  const { prisma } = await import('../../../../lib/prisma')
  const { requireManagementUser } = await import('../../../../lib/auth')
  await requireManagementUser()

  const body = (await req.json().catch(() => null)) as
    | (AssignmentPayload & {
        employeeIds: number[]
        startDate: string
        endDate: string
      })
    | null

  if (
    !body ||
    !Array.isArray(body.employeeIds) ||
    body.employeeIds.length === 0 ||
    !body.startDate ||
    !body.endDate
  ) {
    return NextResponse.json(
      { error: 'Invalid payload: need employeeIds (non-empty), startDate, endDate' },
      { status: 400 }
    )
  }

  const start = new Date(body.startDate)
  const end = new Date(body.endDate)
  const invalidDates =
    Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
  if (invalidDates) {
    return NextResponse.json(
      { error: 'Invalid date format' },
      { status: 400 }
    )
  }

  const daysCount = differenceInDays(end, start) + 1
  if (daysCount < 1 || daysCount > 365) {
    return NextResponse.json(
      { error: 'Date range must be 1–365 days' },
      { status: 400 }
    )
  }

  const { employeeIds, projectId, type, startTime, endTime, workType, meetingPoint, notes } = body
  const rest: AssignmentPayload = {
    projectId: projectId ?? null,
    type,
    startTime: startTime ?? null,
    endTime: endTime ?? null,
    workType: workType ?? null,
    meetingPoint: meetingPoint ?? null,
    notes: notes ?? null
  }

  const created: { userId: number; date: string }[] = []

  for (const employeeId of employeeIds) {
    for (let i = 0; i < daysCount; i++) {
      const day = addDays(start, i)

      if (type === 'OVERRIDE') {
        await prisma.assignment.deleteMany({
          where: {
            userId: employeeId,
            type: 'OVERRIDE',
            date: {
              gte: day,
              lt: addDays(day, 1)
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
            lt: addDays(day, 1)
          }
        }
      })

      if (existingDefault && type === 'DEFAULT') {
        await prisma.assignment.update({
          where: { id: existingDefault.id },
          data: rest
        })
      } else {
        await prisma.assignment.create({
          data: {
            userId: employeeId,
            date: day,
            type,
            projectId: rest.projectId ?? undefined,
            startTime: rest.startTime ?? undefined,
            endTime: rest.endTime ?? undefined,
            workType: rest.workType ?? undefined,
            meetingPoint: rest.meetingPoint ?? undefined,
            notes: rest.notes ?? undefined
          }
        })
      }
      created.push({ userId: employeeId, date: day.toISOString().slice(0, 10) })
    }
  }

  return NextResponse.json({ assigned: created.length, assignments: created })
}
