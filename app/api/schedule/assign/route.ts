export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { requireManagementUser } from '../../../../lib/auth'

export async function POST(req: NextRequest) {
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

  return NextResponse.json({ assignment })
}

