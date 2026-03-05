'use client'

import { addMonths, format, startOfMonth, subMonths } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { parseLocalDate } from '../../lib/date-utils'

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

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function isWeekday(dateKey: string): boolean {
  const d = parseLocalDate(dateKey).getDay()
  return d >= 1 && d <= 5
}

export default function MySchedulePage() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const [days, setDays] = useState<string[]>([])
  const [grid, setGrid] = useState<Record<string, Cell>>({})
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  const monthKey = useMemo(
    () => format(currentMonth, 'yyyy-MM'),
    [currentMonth]
  )

  useEffect(() => {
    setLoading(true)
    fetch(`/api/schedule/week?month=${monthKey}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        const daysList = data.days ?? []
        setDays(daysList)
        const employees = data.employees ?? []
        const g = data.grid ?? {}
        const userId = employees[0]?.id
        setGrid(userId ? g[userId] ?? {} : {})
        setExpandedDay(null)
      })
      .catch(() => {
        setDays([])
        setGrid({})
      })
      .finally(() => setLoading(false))
  }, [monthKey])

  const weeks = useMemo(() => {
    const w: string[][] = []
    for (let i = 0; i < days.length; i += 7) {
      w.push(days.slice(i, i + 7))
    }
    return w
  }, [days])

  const weekdaysOnly = useMemo(
    () => days.filter(isWeekday),
    [days]
  )

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

  const isCurrentMonth = (dateKey: string) => {
    const d = parseLocalDate(dateKey)
    return d.getMonth() === currentMonth.getMonth()
  }

  return (
    <div className="page my-schedule-page">
      <header className="my-schedule-header">
        <h1>My schedule</h1>
        <div className="my-schedule-month-nav">
          <button
            type="button"
            className="btn-icon my-schedule-nav-btn"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="my-schedule-month-label">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            type="button"
            className="btn-icon my-schedule-nav-btn"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </header>

      {loading ? (
        <p>Loading…</p>
      ) : isMobile ? (
        <section className="my-schedule-list">
          {weekdaysOnly.map((dateKey) => {
            const cell = grid[dateKey] ?? emptyCell
            const isAssigned = cell.type !== 'UNASSIGNED' && cell.projectName
            const isExpanded = expandedDay === dateKey
            const timeStr =
              cell.startTime || cell.endTime
                ? [cell.startTime ?? '—', cell.endTime ?? '—'].join(' – ')
                : null
            const jobTitle = [cell.projectName, timeStr].filter(Boolean).join(' · ')
            const isOtherMonth = !isCurrentMonth(dateKey)

            return (
              <article
                key={dateKey}
                className={`my-schedule-list-item ${isOtherMonth ? 'my-schedule-list-item--other-month' : ''}`}
              >
                <div className="my-schedule-list-item-header">
                  <span className="my-schedule-list-item-day">
                    {format(parseLocalDate(dateKey), 'EEE, MMM d')}
                  </span>
                  {isAssigned ? (
                    <span className="my-schedule-list-item-pill">{cell.projectName}</span>
                  ) : (
                    <span className="my-schedule-list-item-unassigned">Unassigned</span>
                  )}
                </div>
                {isAssigned && (
                  <>
                    <button
                      type="button"
                      className="my-schedule-show-more"
                      onClick={() =>
                        setExpandedDay((d) => (d === dateKey ? null : dateKey))
                      }
                    >
                      {isExpanded ? 'Hide details' : 'Show more info'}
                    </button>
                    {isExpanded && (
                      <div className="my-schedule-info-panel">
                        <div className="my-schedule-info-panel-title">{jobTitle}</div>
                        {(cell.workType || cell.meetingPoint || cell.address || cell.notes) && (
                          <div className="my-schedule-info-panel-details">
                            {cell.workType && <p>Work: {cell.workType}</p>}
                            {cell.meetingPoint && <p>Meeting: {cell.meetingPoint}</p>}
                            {cell.address && <p>{cell.address}</p>}
                            {cell.notes && <p className="notes">{cell.notes}</p>}
                          </div>
                        )}
                        {cell.type === 'OVERRIDE' && (
                          <p className="my-schedule-override">Daily override for this day</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </article>
            )
          })}
        </section>
      ) : (
        <section className="my-schedule-calendar">
          <div className="my-schedule-calendar-head">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="my-schedule-calendar-head-cell">
                {label}
              </div>
            ))}
          </div>
          <div className="my-schedule-calendar-body">
            {weeks.map((weekDays, wi) => (
              <div key={wi} className="my-schedule-calendar-row">
                {weekDays.map((dateKey) => {
                  const cell = grid[dateKey] ?? emptyCell
                  const isAssigned = cell.type !== 'UNASSIGNED' && cell.projectName
                  const isExpanded = expandedDay === dateKey
                  const timeStr =
                    cell.startTime || cell.endTime
                      ? [cell.startTime ?? '—', cell.endTime ?? '—'].join(' – ')
                      : null
                  const jobTitle = [cell.projectName, timeStr].filter(Boolean).join(' · ')

                  return (
                    <div
                      key={dateKey}
                      className={`my-schedule-day-cell ${!isCurrentMonth(dateKey) ? 'my-schedule-day-cell--other-month' : ''}`}
                    >
                      <div className="my-schedule-day-num">
                        {format(parseLocalDate(dateKey), 'd')}
                      </div>
                      {isAssigned ? (
                        <div className="my-schedule-day-content">
                          <div className="my-schedule-day-pill">
                            {cell.projectName}
                          </div>
                          <button
                            type="button"
                            className="my-schedule-show-more"
                            onClick={() =>
                              setExpandedDay((d) => (d === dateKey ? null : dateKey))
                            }
                          >
                            {isExpanded ? 'Hide details' : 'Show more info'}
                          </button>
                          {isExpanded && (
                            <div className="my-schedule-info-panel">
                              <div className="my-schedule-info-panel-title">
                                {jobTitle}
                              </div>
                              {(cell.workType || cell.meetingPoint || cell.address || cell.notes) && (
                                <div className="my-schedule-info-panel-details">
                                  {cell.workType && (
                                    <p>Work: {cell.workType}</p>
                                  )}
                                  {cell.meetingPoint && (
                                    <p>Meeting: {cell.meetingPoint}</p>
                                  )}
                                  {cell.address && <p>{cell.address}</p>}
                                  {cell.notes && <p className="notes">{cell.notes}</p>}
                                </div>
                              )}
                              {cell.type === 'OVERRIDE' && (
                                <p className="my-schedule-override">Daily override for this day</p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="my-schedule-unassigned">Unassigned</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
