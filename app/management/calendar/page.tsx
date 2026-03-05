'use client'

import {
  addMonths,
  differenceInDays,
  endOfMonth,
  format,
  startOfMonth,
  subMonths
} from 'date-fns'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { parseLocalDateSafe } from '../../../lib/date-utils'

type Project = {
  id: number
  name: string
  address: string
  status: string
  startDate: string | null
  endDate: string | null
  customer: string | null
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' }
] as const

export default function ProjectCalendarPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE')
  const [rangeStart, setRangeStart] = useState(() =>
    startOfMonth(subMonths(new Date(), 1))
  )
  const [monthsCount] = useState(12)

  const rangeEnd = useMemo(
    () => endOfMonth(addMonths(rangeStart, monthsCount - 1)),
    [rangeStart, monthsCount]
  )

  const months = useMemo(() => {
    const m: Date[] = []
    let d = startOfMonth(rangeStart)
    for (let i = 0; i < monthsCount; i++) {
      m.push(d)
      d = addMonths(d, 1)
    }
    return m
  }, [rangeStart, monthsCount])

  const totalDays = useMemo(
    () => differenceInDays(rangeEnd, rangeStart) + 1,
    [rangeStart, rangeEnd]
  )

  useEffect(() => {
    setLoading(true)
    const url =
      statusFilter && statusFilter !== 'ALL'
        ? `/api/projects?status=${statusFilter}`
        : '/api/projects?status=ALL'
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setProjects(data.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [statusFilter])

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter && statusFilter !== 'ALL') return p.status === statusFilter
      return true
    })
  }, [projects, statusFilter])

  function barStyle(p: Project): React.CSSProperties {
    const start = parseLocalDateSafe(p.startDate) ?? rangeStart
    const end = parseLocalDateSafe(p.endDate) ?? rangeEnd
    const leftDays = Math.max(0, differenceInDays(start, rangeStart))
    const spanDays = Math.max(1, differenceInDays(end, start) + 1)
    const left = (leftDays / totalDays) * 100
    const width = Math.min((spanDays / totalDays) * 100, 100 - left)
    const statusColor =
      p.status === 'ACTIVE'
        ? '#4f46e5'
        : p.status === 'ON_HOLD'
          ? '#d97706'
          : p.status === 'COMPLETED'
            ? '#16a34a'
            : '#64748b'
    return {
      left: `${left}%`,
      width: `${width}%`,
      backgroundColor: statusColor
    }
  }

  function shiftRange(offset: number) {
    setRangeStart((prev) => addMonths(prev, offset))
  }

  return (
    <div className="page project-calendar-page">
      <header className="project-calendar-header">
        <h1 className="dashboard-page-title">Project calendar</h1>
        <div className="project-calendar-actions">
          <Link href="/management/schedule" className="btn-primary">
            Assign schedule (daily)
          </Link>
        </div>
      </header>

      <p className="project-calendar-desc">
        Track project timelines. Set start/end dates when adding or editing a project. Overlapping
        projects are shown in separate rows. Use <strong>Assign schedule</strong> to assign
        employees to projects by day.
      </p>

      <div className="project-calendar-toolbar">
        <div className="project-calendar-nav">
          <button
            type="button"
            className="project-calendar-nav-btn"
            onClick={() => shiftRange(-monthsCount)}
            aria-label="Previous range"
          >
            ‹‹
          </button>
          <button
            type="button"
            className="project-calendar-nav-btn"
            onClick={() => shiftRange(-1)}
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="project-calendar-range">
            {format(rangeStart, 'MMM yyyy')} – {format(months[months.length - 1], 'MMM yyyy')}
          </span>
          <button
            type="button"
            className="project-calendar-nav-btn"
            onClick={() => shiftRange(1)}
            aria-label="Next month"
          >
            ›
          </button>
          <button
            type="button"
            className="project-calendar-nav-btn"
            onClick={() => shiftRange(monthsCount)}
            aria-label="Next range"
          >
            ››
          </button>
        </div>
        <label className="project-calendar-filter">
          <span className="project-calendar-filter-label">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="project-calendar-select"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="project-calendar-loading">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="project-calendar-empty">
          No projects in this view. Add projects with start/end dates in{' '}
          <Link href="/management/projects">Projects</Link>.
        </p>
      ) : (
        <div className="project-calendar-wrap">
          <div className="project-calendar-timeline">
            <div className="project-calendar-head">
              <div className="project-calendar-head-label">Project</div>
              <div className="project-calendar-head-bar">
                {months.map((m) => (
                  <span key={m.toISOString()} className="project-calendar-month-tick">
                    {format(m, 'MMM')}
                  </span>
                ))}
              </div>
            </div>
            {filtered.map((p) => (
              <div key={p.id} className="project-calendar-row">
                <div className="project-calendar-row-label">
                  <span className="project-calendar-row-name">{p.name}</span>
                  {p.address && (
                    <span className="project-calendar-row-address">{p.address}</span>
                  )}
                  <span className="project-calendar-row-meta">
                    <span className={`project-calendar-row-status project-calendar-row-status--${p.status.toLowerCase()}`}>
                      {STATUS_OPTIONS.find((o) => o.value === p.status)?.label ?? p.status}
                    </span>
                    {(p.startDate || p.endDate) && (() => {
                      const start = parseLocalDateSafe(p.startDate)
                      const end = parseLocalDateSafe(p.endDate)
                      if (!start && !end) return null
                      return (
                        <span className="project-calendar-row-dates">
                          {start && format(start, 'MMM d, yyyy')}
                          {start && end && ' – '}
                          {end && format(end, 'MMM d, yyyy')}
                        </span>
                      )
                    })()}
                  </span>
                </div>
                <div className="project-calendar-row-bar-wrap">
                  <div
                    className="project-calendar-row-bar"
                    style={barStyle(p)}
                    title={`${p.name}${(() => {
                      const s = parseLocalDateSafe(p.startDate)
                      const e = parseLocalDateSafe(p.endDate)
                      if (s && e) return ` ${format(s, 'MMM d, yyyy')} – ${format(e, 'MMM d, yyyy')}`
                      if (s) return ` from ${format(s, 'MMM d, yyyy')}`
                      if (e) return ` until ${format(e, 'MMM d, yyyy')}`
                      return ' (ongoing)'
                    })()}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
