export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  eachDayOfInterval
} from 'date-fns'
import { apiErrorResponse } from '../../../../lib/api-errors'
import { toLocalDateKey } from '../../../../lib/date-utils'

export async function GET(req: NextRequest) {
  try {
    const { prisma } = await import('../../../../lib/prisma')
    const { requireCurrentUser } = await import('../../../../lib/auth')
    const user = await requireCurrentUser()

    const weekStartParam = req.nextUrl.searchParams.get('start') || undefined
    const monthParam = req.nextUrl.searchParams.get('month') || undefined
    const employeeIdParam = req.nextUrl.searchParams.get('employeeId') || undefined

    const forEmployeeId =
      employeeIdParam || (user.role === 'EMPLOYEE' ? String(user.id) : undefined)

    let days: Date[]
    if (monthParam) {
      const [y, m] = monthParam.split('-').map(Number)
      const monthStart = startOfMonth(new Date(y, (m ?? 1) - 1, 1))
      const monthEnd = endOfMonth(monthStart)
      const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
      days = eachDayOfInterval({ start: calStart, end: calEnd })
    } else {
      const weekStart = weekStartParam
        ? new Date(weekStartParam)
        : startOfWeek(new Date(), { weekStartsOn: 1 })
      days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))
    }

    const first = days[0]
    const last = days[days.length - 1]
    const rangeStart = new Date(Date.UTC(first.getFullYear(), first.getMonth(), first.getDate(), 0, 0, 0, 0))
    const rangeEnd = new Date(Date.UTC(last.getFullYear(), last.getMonth(), last.getDate() + 1, 0, 0, 0, 0))

    const { SUPER_ADMIN_EMAIL_CANONICAL } = await import('../../../../lib/super-admin')
    const allUsers =
      user.role === 'MANAGEMENT'
        ? await prisma.user.findMany({ orderBy: { name: 'asc' } })
        : await prisma.user.findMany({ where: { id: user.id } })
    const employees = allUsers.filter((u) => u.email !== SUPER_ADMIN_EMAIL_CANONICAL)

    const assignments = await prisma.assignment.findMany({
      where: {
        date: {
          gte: rangeStart,
          lt: rangeEnd
        },
        ...(forEmployeeId ? { userId: Number(forEmployeeId) } : {})
      },
      include: { project: true },
      orderBy: [{ date: 'asc' }, { id: 'asc' }]
    })

    const grid: Record<
      number,
      Record<
        string,
        Array<{
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
        }>
      >
    > = {}

    for (const employee of employees) {
      grid[employee.id] = {}
    }

    for (const d of days) {
      const key = toLocalDateKey(d)
      for (const employee of employees) {
        grid[employee.id][key] = grid[employee.id][key] || []
      }
    }
    

    for (const a of assignments) {
      const key = toLocalDateKey(a.date)
      if (!grid[a.userId]) continue

      grid[a.userId][key].push({
        id: a.id,
        type: 'DEFAULT',
        projectId: a.projectId ?? null,
        projectName: a.project?.name ?? null,
        address: a.project?.address ?? null,
        notes: a.notes ?? a.project?.notes ?? null,
        workType: a.workType ?? null,
        startTime: a.startTime ?? null,
        endTime: a.endTime ?? null,
        meetingPoint: a.meetingPoint ?? null
      })
    }

    return NextResponse.json({
      weekStart: days[0],
      days: days.map((d) => toLocalDateKey(d)),
      employees: employees.map((e) => ({
        id: e.id,
        name: e.name,
        role: e.role
      })),
      grid
    })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load schedule.')
  }
}

