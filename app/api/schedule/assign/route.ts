export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { format } from 'date-fns'
import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '../../../../lib/api-errors'
import { getTimeWindowError, timesOverlap } from '../../../../lib/schedule-utils'

export async function POST(req: NextRequest) {
  try {
    const { prisma } = await import('../../../../lib/prisma')
    const { requireManagementUser } = await import('../../../../lib/auth')
    const { sendAssignmentNotification } = await import('../../../../lib/email')
    await requireManagementUser()
    const body = (await req.json().catch(() => null)) as
      | {
          assignmentId?: number | null
          employeeId: number
          date: string
          projectId: number | null
          type?: string | null
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

    const timeWindowError = getTimeWindowError(body.startTime, body.endTime)
    if (timeWindowError) {
      return NextResponse.json({ error: timeWindowError }, { status: 400 })
    }

    const { assignmentId, employeeId, date, projectId, type: _type, ...rest } = body
    const day = new Date(date)
    const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000)
    const existingAssignments = await prisma.assignment.findMany({
      where: {
        userId: employeeId,
        date: {
          gte: day,
          lt: nextDay
        },
        ...(assignmentId ? { id: { not: assignmentId } } : {})
      },
      orderBy: { id: 'asc' }
    })

    const conflictingAssignment = existingAssignments.find((assignment) =>
      timesOverlap(rest.startTime, rest.endTime, assignment.startTime, assignment.endTime)
    )

    if (conflictingAssignment) {
      const project = conflictingAssignment.projectId
        ? await prisma.project.findUnique({
            where: { id: conflictingAssignment.projectId },
            select: { name: true }
          })
        : null
      return NextResponse.json(
        {
          error: `This time overlaps with ${project?.name ?? 'another assignment'} on the same day.`
        },
        { status: 400 }
      )
    }

    const assignmentData = {
      type: 'DEFAULT',
      projectId: projectId ?? null,
      ...rest
    }

    let assignment
    if (assignmentId) {
      assignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: assignmentData
      })
    } else {
      assignment = await prisma.assignment.create({
        data: {
          userId: employeeId,
          date: day,
          ...assignmentData
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
  } catch (error) {
    return apiErrorResponse(error, 'Failed to save assignment.')
  }
}

