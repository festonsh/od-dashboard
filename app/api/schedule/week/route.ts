export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { startOfWeek, addDays } from 'date-fns'
import { prisma } from '../../../../lib/prisma'
import { requireCurrentUser } from '../../../../lib/auth'

export async function GET(req: NextRequest) {
  const user = await requireCurrentUser()

  const weekStartParam = req.nextUrl.searchParams.get('start') || undefined
  const employeeIdParam = req.nextUrl.searchParams.get('employeeId') || undefined

  const forEmployeeId =
    employeeIdParam || (user.role === 'EMPLOYEE' ? String(user.id) : undefined)

  const weekStart = weekStartParam
    ? new Date(weekStartParam)
    : startOfWeek(new Date(), { weekStartsOn: 1 })

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))

  const employees =
    user.role === 'MANAGEMENT'
      ? await prisma.user.findMany({ orderBy: { name: 'asc' } })
      : await prisma.user.findMany({ where: { id: user.id } })

  const assignments = await prisma.assignment.findMany({
    where: {
      date: {
        gte: days[0],
        lt: addDays(days[6], 1)
      },
      ...(forEmployeeId ? { userId: Number(forEmployeeId) } : {})
    },
    include: { project: true }
  })

  const grid: Record<
    number,
    Record<
      string,
      {
        id: number
        type: string
        projectId: number | null
        projectName: string | null
        address: string | null
        notes: string | null
        workType: string | null
        startTime: string | null
        endTime: string | null
        meetingPoint: string | null
      }
    >
  > = {}

  for (const employee of employees) {
    grid[employee.id] = {}
  }

  for (const d of days) {
    const key = d.toISOString().slice(0, 10)
    for (const employee of employees) {
      grid[employee.id][key] = grid[employee.id][key] || {
        id: 0,
        type: 'UNASSIGNED',
        projectId: null,
        projectName: null,
        address: null,
        notes: null,
        workType: null,
        startTime: null,
        endTime: null,
        meetingPoint: null
      }
    }
  }

  for (const a of assignments) {
    const key = a.date.toISOString().slice(0, 10)
    const existing = grid[a.userId]?.[key]

    if (!existing || existing.type === 'DEFAULT' || a.type === 'OVERRIDE') {
      grid[a.userId][key] = {
        id: a.id,
        type: a.type,
        projectId: a.projectId ?? null,
        projectName: a.project?.name ?? null,
        address: a.project?.address ?? null,
        notes: a.notes ?? a.project?.notes ?? null,
        workType: a.workType ?? null,
        startTime: a.startTime ?? null,
        endTime: a.endTime ?? null,
        meetingPoint: a.meetingPoint ?? null
      }
    }
  }

  return NextResponse.json({
    weekStart: days[0],
    days: days.map((d) => d.toISOString().slice(0, 10)),
    employees: employees.map((e) => ({
      id: e.id,
      name: e.name,
      role: e.role
    })),
    grid
  })
}

