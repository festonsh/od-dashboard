export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { addDays, differenceInDays, format } from 'date-fns'
import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '../../../../lib/api-errors'
import { getTimeWindowError, timesOverlap } from '../../../../lib/schedule-utils'

type AssignmentPayload = {
  projectId: number | null
  type?: string | null
  startTime?: string | null
  endTime?: string | null
  workType?: string | null
  meetingPoint?: string | null
  notes?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const { prisma } = await import('../../../../lib/prisma')
    const { requireManagementUser } = await import('../../../../lib/auth')
    const { sendBulkAssignmentNotification } = await import('../../../../lib/email')
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

    const todayStr = new Date().toISOString().slice(0, 10)
    const startStr = body.startDate.trim().slice(0, 10)
    if (startStr < todayStr) {
      return NextResponse.json(
        { error: 'Cannot assign to past dates. Start date must be today or later.' },
        { status: 400 }
      )
    }

    const { employeeIds, projectId, type: _type, startTime, endTime, workType, meetingPoint, notes } = body
    const timeWindowError = getTimeWindowError(startTime, endTime)
    if (timeWindowError) {
      return NextResponse.json({ error: timeWindowError }, { status: 400 })
    }

    const rest: AssignmentPayload = {
      projectId: projectId ?? null,
      startTime: startTime ?? null,
      endTime: endTime ?? null,
      workType: workType ?? null,
      meetingPoint: meetingPoint ?? null,
      notes: notes ?? null
    }

    for (const employeeId of employeeIds) {
      for (let i = 0; i < daysCount; i++) {
        const day = addDays(start, i)
        const nextDay = addDays(day, 1)
        const existingAssignments = await prisma.assignment.findMany({
          where: {
            userId: employeeId,
            date: {
              gte: day,
              lt: nextDay
            }
          },
          orderBy: { id: 'asc' }
        })

        const conflict = existingAssignments.find((assignment) =>
          timesOverlap(rest.startTime, rest.endTime, assignment.startTime, assignment.endTime)
        )

        if (conflict) {
          const project = conflict.projectId
            ? await prisma.project.findUnique({
                where: { id: conflict.projectId },
                select: { name: true }
              })
            : null
          return NextResponse.json(
            {
              error: `A time conflict was found on ${format(day, 'EEE, MMM d, yyyy')} for ${project?.name ?? 'another assignment'}.`
            },
            { status: 400 }
          )
        }
      }
    }

    const created: { userId: number; date: string }[] = []

    for (const employeeId of employeeIds) {
      for (let i = 0; i < daysCount; i++) {
        const day = addDays(start, i)
        await prisma.assignment.create({
          data: {
            userId: employeeId,
            date: day,
            type: 'DEFAULT',
            projectId: rest.projectId ?? null,
            startTime: rest.startTime ?? null,
            endTime: rest.endTime ?? null,
            workType: rest.workType ?? null,
            meetingPoint: rest.meetingPoint ?? null,
            notes: rest.notes ?? null
          }
        })
        created.push({ userId: employeeId, date: day.toISOString().slice(0, 10) })
      }
    }

    const uniqueUserIds = [...new Set(created.map((c) => c.userId))]
    const project = body.projectId
      ? await prisma.project.findUnique({ where: { id: body.projectId }, select: { name: true } })
      : null
    const projectName = project?.name ?? 'Assignment'
    const startDateStr = format(start, 'EEE, MMM d, yyyy')
    const endDateStr = format(end, 'EEE, MMM d, yyyy')

    for (const userId of uniqueUserIds) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      })
      if (user?.email) {
        await sendBulkAssignmentNotification({
          to: user.email,
          employeeName: user.name ?? 'there',
          projectName,
          startDate: startDateStr,
          endDate: endDateStr,
          startTime: rest.startTime ?? null,
          endTime: rest.endTime ?? null,
          workType: rest.workType ?? null,
          meetingPoint: rest.meetingPoint ?? null,
          notes: rest.notes ?? null
        })
      }
    }

    return NextResponse.json({ assigned: created.length, assignments: created })
  } catch (error) {
    return apiErrorResponse(error, 'Bulk assign failed.')
  }
}
