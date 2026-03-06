'use client'

import { addMonths, format, startOfMonth, subMonths } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { parseLocalDate, toLocalDateKey } from '../../lib/date-utils'

type Cell = {
  type: string
  id: number
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

function sortAssignments(assignments: Cell[]): Cell[] {
  return [...assignments].sort((a, b) => {
    const aTime = a.startTime ?? '99:99'
    const bTime = b.startTime ?? '99:99'
    return aTime.localeCompare(bTime) || a.id - b.id
  })
}

function formatAssignmentTime(assignment: Pick<Cell, 'startTime' | 'endTime'>): string | null {
  return assignment.startTime || assignment.endTime
    ? [assignment.startTime ?? '—', assignment.endTime ?? '—'].join(' – ')
    : null
}

export default function MySchedulePage() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const [days, setDays] = useState<string[]>([])
  const [grid, setGrid] = useState<Record<string, Cell[]>>({})
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [employeeId, setEmployeeId] = useState<number | null>(null)
  const [authResolved, setAuthResolved] = useState(false)

  const monthKey = useMemo(
    () => format(currentMonth, 'yyyy-MM'),
    [currentMonth]
  )

  useEffect(() => {
    let cancelled = false

    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        if (cancelled) return
        setEmployeeId(typeof data.user?.id === 'number' ? data.user.id : null)
      })
      .catch(() => {
        if (cancelled) return
        setEmployeeId(null)
      })
      .finally(() => {
        if (!cancelled) setAuthResolved(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!authResolved) return
    if (employeeId == null) {
      setDays([])
      setGrid({})
      setExpandedDay(null)
      setLoading(false)
      return
    }

    setLoading(true)
    fetch(`/api/schedule/week?month=${monthKey}&employeeId=${employeeId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        const daysList = data.days ?? []
        setDays(daysList)
        const g = data.grid ?? {}
        setGrid(g[employeeId] ?? {})
        setExpandedDay(null)
      })
      .catch(() => {
        setDays([])
        setGrid({})
      })
      .finally(() => setLoading(false))
  }, [authResolved, employeeId, monthKey])

  const weeks = useMemo(() => {
    const w: string[][] = []
    for (let i = 0; i < days.length; i += 7) {
      w.push(days.slice(i, i + 7))
    }
    return w
  }, [days])

  const mobileDays = useMemo(() => {
    const todayKey = toLocalDateKey(new Date())
    const pastDays = days.filter((dateKey) => dateKey < todayKey)
    const recentPastDays = new Set(pastDays.slice(-3))
    return days.filter((dateKey) => dateKey >= todayKey || recentPastDays.has(dateKey))
  }, [days])

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
      ) : employeeId == null ? (
        <p>No schedule is available for this account.</p>
      ) : isMobile ? (
        <section className="my-schedule-list">
          {mobileDays.map((dateKey) => {
            const assignments = sortAssignments(grid[dateKey] ?? [])
            const isAssigned = assignments.length > 0
            const isExpanded = expandedDay === dateKey
            const isOtherMonth = !isCurrentMonth(dateKey)
            const primaryLabel =
              assignments.length === 1
                ? assignments[0]?.projectName
                : `${assignments.length} jobs`

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
                    <span className="my-schedule-list-item-pill">{primaryLabel}</span>
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
                        {assignments.map((assignment) => {
                          const timeStr = formatAssignmentTime(assignment)
                          const jobTitle = [assignment.projectName, timeStr].filter(Boolean).join(' · ')

                          return (
                            <div key={assignment.id} className="my-schedule-assignment-block">
                              <div className="my-schedule-info-panel-title">{jobTitle}</div>
                              {(assignment.workType || assignment.meetingPoint || assignment.address || assignment.notes) && (
                                <div className="my-schedule-info-panel-details">
                                  {assignment.workType && <p>Work: {assignment.workType}</p>}
                                  {assignment.meetingPoint && <p>Meeting: {assignment.meetingPoint}</p>}
                                  {assignment.address && <p>{assignment.address}</p>}
                                  {assignment.notes && <p className="notes">{assignment.notes}</p>}
                                </div>
                              )}
                            </div>
                          )
                        })}
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
                  const assignments = sortAssignments(grid[dateKey] ?? [])
                  const isAssigned = assignments.length > 0
                  const isExpanded = expandedDay === dateKey

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
                          <div className="my-schedule-day-pill-stack">
                            {assignments.slice(0, 2).map((assignment) => (
                              <div key={assignment.id} className="my-schedule-day-pill">
                                {assignment.projectName}
                              </div>
                            ))}
                            {assignments.length > 2 && (
                              <div className="my-schedule-day-pill my-schedule-day-pill--more">
                                +{assignments.length - 2} more
                              </div>
                            )}
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
                              {assignments.map((assignment) => {
                                const timeStr = formatAssignmentTime(assignment)
                                const jobTitle = [assignment.projectName, timeStr].filter(Boolean).join(' · ')

                                return (
                                  <div key={assignment.id} className="my-schedule-assignment-block">
                                    <div className="my-schedule-info-panel-title">
                                      {jobTitle}
                                    </div>
                                    {(assignment.workType || assignment.meetingPoint || assignment.address || assignment.notes) && (
                                      <div className="my-schedule-info-panel-details">
                                        {assignment.workType && (
                                          <p>Work: {assignment.workType}</p>
                                        )}
                                        {assignment.meetingPoint && (
                                          <p>Meeting: {assignment.meetingPoint}</p>
                                        )}
                                        {assignment.address && <p>{assignment.address}</p>}
                                        {assignment.notes && <p className="notes">{assignment.notes}</p>}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
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
