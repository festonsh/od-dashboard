import { format } from 'date-fns'
import { prisma } from '../../lib/prisma'
import { requireCurrentUser } from '../../lib/auth'

export default async function MySchedulePage() {
  const user = await requireCurrentUser()

  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - start.getDay() + 1)
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })

  const assignments = await prisma.assignment.findMany({
    where: {
      userId: user.id,
      date: {
        gte: days[0],
        lt: new Date(days[6].getTime() + 24 * 60 * 60 * 1000)
      }
    },
    include: { project: true }
  })

  const byDay = new Map<
    string,
    {
      type: string
      projectName: string | null
      address: string | null
      notes: string | null
      workType: string | null
      startTime: string | null
      endTime: string | null
      meetingPoint: string | null
    }
  >()

  for (const a of assignments) {
    const key = a.date.toISOString().slice(0, 10)
    const existing = byDay.get(key)
    if (!existing || existing.type === 'DEFAULT' || a.type === 'OVERRIDE') {
      byDay.set(key, {
        type: a.type,
        projectName: a.project?.name ?? null,
        address: a.project?.address ?? null,
        notes: a.notes ?? a.project?.notes ?? null,
        workType: a.workType ?? null,
        startTime: a.startTime ?? null,
        endTime: a.endTime ?? null,
        meetingPoint: a.meetingPoint ?? null
      })
    }
  }

  return (
    <div className="page">
      <header className="header">
        <h1>My schedule</h1>
        <p className="subtitle">
          Week of {format(days[0], 'MMM d, yyyy')}
        </p>
      </header>

      <section className="cards">
        {days.map((day) => {
          const key = day.toISOString().slice(0, 10)
          const cell =
            byDay.get(key) ||
            ({
              type: 'UNASSIGNED',
              projectName: null,
              address: null,
              notes: null,
              workType: null,
              startTime: null,
              endTime: null,
              meetingPoint: null
            } as const)

          return (
            <article key={key} className="card">
              <h2>{format(day, 'EEE, MMM d')}</h2>
              <p className="project">
                {cell.projectName || 'Unassigned'}
              </p>
              {cell.address && <p className="meta">{cell.address}</p>}
              {cell.workType && (
                <p className="meta">Work: {cell.workType}</p>
              )}
              {cell.meetingPoint && (
                <p className="meta">Meeting: {cell.meetingPoint}</p>
              )}
              {(cell.startTime || cell.endTime) && (
                <p className="meta">
                  Time: {cell.startTime || 'All day'}
                  {cell.endTime && ` – ${cell.endTime}`}
                </p>
              )}
              {cell.notes && <p className="notes">{cell.notes}</p>}
              {cell.type === 'OVERRIDE' && (
                <p className="override">Daily override for this day</p>
              )}
            </article>
          )
        })}
      </section>
    </div>
  )
}

