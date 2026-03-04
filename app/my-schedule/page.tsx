'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'

type Cell = {
  type: string
  projectName: string | null
  address: string | null
  notes: string | null
  workType: string | null
  startTime: string | null
  endTime: string | null
  meetingPoint: string | null
}

export default function MySchedulePage() {
  const [days, setDays] = useState<string[]>([])
  const [grid, setGrid] = useState<Record<string, Cell>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/schedule/week')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        const daysList = data.days ?? []
        setDays(daysList)
        const employees = data.employees ?? []
        const g = data.grid ?? {}
        const userId = employees[0]?.id
        setGrid(userId ? g[userId] ?? {} : {})
      })
      .catch(() => {
        setDays([])
        setGrid({})
      })
      .finally(() => setLoading(false))
  }, [])

  const emptyCell: Cell = {
    type: 'UNASSIGNED',
    projectName: null,
    address: null,
    notes: null,
    workType: null,
    startTime: null,
    endTime: null,
    meetingPoint: null
  }

  return (
    <div className="page">
      <header className="header">
        <h1>My schedule</h1>
        {days[0] && (
          <p className="subtitle">
            Week of {format(new Date(days[0]), 'MMM d, yyyy')}
          </p>
        )}
      </header>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <section className="cards">
          {days.map((dateKey) => {
            const cell = grid[dateKey] ?? emptyCell
            return (
              <article key={dateKey} className="card">
                <h2>{format(new Date(dateKey), 'EEE, MMM d')}</h2>
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
      )}
    </div>
  )
}
