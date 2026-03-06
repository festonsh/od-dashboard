'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, format, startOfWeek } from 'date-fns'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { parseLocalDate, toLocalDateKey } from '../../../lib/date-utils'

function isPastDate(dateKey: string): boolean {
  return dateKey < toLocalDateKey(new Date())
}

function isToday(dateKey: string): boolean {
  return dateKey === toLocalDateKey(new Date())
}

type GridAssignment = {
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

type Employee = { id: number; name: string; role: string }
type Project = { id: number; name: string }

function isWeekday(dateKey: string): boolean {
  const d = parseLocalDate(dateKey).getDay()
  return d >= 1 && d <= 5
}

export default function SchedulePage() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()
  )
  const [data, setData] = useState<{
    days: string[]
    employees: Employee[]
    grid: Record<number, Record<string, GridAssignment>>
  } | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    ;(async () => {
      const res = await fetch(`/api/schedule/week?start=${encodeURIComponent(weekStart)}`)
      const json = await res.json()
      setData({ days: json.days, employees: json.employees, grid: json.grid })
    })()
  }, [weekStart])

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/projects?status=ACTIVE')
      const json = await res.json()
      setProjects(json.projects)
    })()
  }, [])

  const employees = useMemo(
    () =>
      (data?.employees ?? []).filter((e) =>
        e.name.toLowerCase().includes(employeeFilter.toLowerCase())
      ),
    [data, employeeFilter]
  )

  const days = data?.days ?? []
  const grid = data?.grid ?? {}

  function cell(employeeId: number, day: string): GridAssignment {
    return (
      grid?.[employeeId]?.[day] || {
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
    )
  }

  function shiftWeek(offset: number) {
    const current = new Date(weekStart)
    const next = addDays(current, offset * 7)
    setWeekStart(next.toISOString())
  }

  function resetWeek() {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString())
  }

  function goToDate(date: Date) {
    setWeekStart(startOfWeek(date, { weekStartsOn: 1 }).toISOString())
  }

  const datePickerValue = weekStart.slice(0, 10)

  const [assignError, setAssignError] = useState('')
  const [dialogState, setDialogState] = useState<{
    open: boolean
    assignmentId: number
    employeeId: number | null
    date: string | null
    form: {
      projectId: number
      type: 'DEFAULT' | 'OVERRIDE'
      startTime: string
      endTime: string
      workType: string
      meetingPoint: string
      notes: string
    }
  }>({
    open: false,
    assignmentId: 0,
    employeeId: null,
    date: null,
    form: {
      projectId: 0,
      type: 'DEFAULT',
      startTime: '',
      endTime: '',
      workType: '',
      meetingPoint: '',
      notes: ''
    }
  })

  const selectAllCheckRef = useRef<HTMLInputElement>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkForm, setBulkForm] = useState({
    projectId: 0,
    type: 'DEFAULT' as 'DEFAULT' | 'OVERRIDE',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    workType: '',
    meetingPoint: '',
    notes: ''
  })

  const weekStartDate = new Date(weekStart)
  const weekEndDate = addDays(weekStartDate, 6)
  const defaultStart = format(weekStartDate, 'yyyy-MM-dd')
  const defaultEnd = format(weekEndDate, 'yyyy-MM-dd')

  function toggleEmployeeSelection(id: number) {
    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllEmployees() {
    if (selectedEmployeeIds.size === employees.length) {
      setSelectedEmployeeIds(new Set())
    } else {
      setSelectedEmployeeIds(new Set(employees.map((e) => e.id)))
    }
  }

  useEffect(() => {
    const el = selectAllCheckRef.current
    if (el)
      el.indeterminate = employees.length > 0 && selectedEmployeeIds.size > 0 && selectedEmployeeIds.size < employees.length
  }, [employees.length, selectedEmployeeIds.size])

  function openBulkAssign() {
    const todayKey = toLocalDateKey(new Date())
    setBulkForm((f) => {
      const start = f.startDate || defaultStart
      const end = f.endDate || defaultEnd
      const startSafe = start < todayKey ? todayKey : start
      const endSafe = end < startSafe ? startSafe : end
      return { ...f, startDate: startSafe, endDate: endSafe }
    })
    setBulkOpen(true)
  }

  async function saveBulkAssign() {
    const todayKey = toLocalDateKey(new Date())
    const startDate = bulkForm.startDate || defaultStart
    const endDate = bulkForm.endDate || defaultEnd
    if (startDate < todayKey) {
      alert('Start date cannot be in the past.')
      return
    }
    const projectId = bulkForm.projectId || null
    const employeeIds = Array.from(selectedEmployeeIds)
    if (employeeIds.length === 0) return
    setBulkSaving(true)
    try {
      const res = await fetch('/api/schedule/assign-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds,
          startDate,
          endDate,
          projectId,
          type: bulkForm.type,
          startTime: bulkForm.startTime || null,
          endTime: bulkForm.endTime || null,
          workType: bulkForm.workType || null,
          meetingPoint: bulkForm.meetingPoint || null,
          notes: bulkForm.notes || null
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Bulk assign failed')
        return
      }
      setBulkOpen(false)
      setSelectedEmployeeIds(new Set())
      const weekRes = await fetch(`/api/schedule/week?start=${encodeURIComponent(weekStart)}`)
      const json = await weekRes.json()
      setData({ days: json.days, employees: json.employees, grid: json.grid })
    } finally {
      setBulkSaving(false)
    }
  }

  function openEditor(employeeId: number, day: string) {
    if (isPastDate(day)) return
    setAssignError('')
    const existing = cell(employeeId, day)
    setDialogState({
      open: true,
      assignmentId: existing.id ?? 0,
      employeeId,
      date: day,
      form: {
        projectId: existing.projectId ?? 0,
        type: existing.type === 'OVERRIDE' ? 'OVERRIDE' : 'DEFAULT',
        startTime: existing.startTime || '',
        endTime: existing.endTime || '',
        workType: existing.workType || '',
        meetingPoint: existing.meetingPoint || '',
        notes: existing.notes || ''
      }
    })
  }

  function closeDialog() {
    setAssignError('')
    setDialogState((s) => ({ ...s, open: false }))
  }

  async function saveEdit() {
    if (!dialogState.employeeId || !dialogState.date) return
    if (isPastDate(dialogState.date)) {
      setAssignError('Cannot assign to a past date.')
      return
    }
    if (!dialogState.form.projectId || dialogState.form.projectId < 1) {
      setAssignError('Please select a project.')
      return
    }
    if (!dialogState.form.startTime?.trim()) {
      setAssignError('Start time is required.')
      return
    }
    if (!dialogState.form.endTime?.trim()) {
      setAssignError('End time is required.')
      return
    }
    setAssignError('')
    const res = await fetch('/api/schedule/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: dialogState.employeeId,
        date: dialogState.date,
        projectId: dialogState.form.projectId || null,
        type: dialogState.form.type,
        startTime: dialogState.form.startTime?.trim() || null,
        endTime: dialogState.form.endTime?.trim() || null,
        workType: dialogState.form.workType || null,
        meetingPoint: dialogState.form.meetingPoint || null,
        notes: dialogState.form.notes || null
      })
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setAssignError(data.error || 'Failed to save.')
      return
    }
    const weekRes = await fetch(`/api/schedule/week?start=${encodeURIComponent(weekStart)}`)
    const json = await weekRes.json()
    setData({ days: json.days, employees: json.employees, grid: json.grid })
    closeDialog()
  }

  const formattedMonthYear = format(weekStartDate, 'MMMM yyyy')
  const formattedWeekRange = `${format(weekStartDate, 'MMM d')} – ${format(weekEndDate, 'MMM d, yyyy')}`

  const assignmentsList = useMemo(() => {
    const list: { employeeName: string; day: string; c: GridAssignment }[] = []
    for (const employee of employees) {
      for (const day of days) {
        const c = cell(employee.id, day)
        if (c.projectName && c.type !== 'UNASSIGNED') {
          list.push({ employeeName: employee.name, day, c })
        }
      }
    }
    list.sort((a, b) => a.day.localeCompare(b.day) || a.employeeName.localeCompare(b.employeeName))
    return list
  }, [employees, days, grid])

  const assignmentsListFiltered = useMemo(
    () =>
      isMobile ? assignmentsList.filter(({ day }) => isWeekday(day)) : assignmentsList,
    [assignmentsList, isMobile]
  )

  return (
    <div className="page schedule-page">
      <header className="calendar-toolbar">
        <div className="calendar-nav">
          <button type="button" className="calendar-nav-btn" onClick={() => shiftWeek(-1)} aria-label="Previous week">
            ‹
          </button>
          <div className="calendar-title">
            <span className="calendar-month">{formattedMonthYear}</span>
            <span className="calendar-range">{formattedWeekRange}</span>
          </div>
          <button type="button" className="calendar-nav-btn" onClick={() => shiftWeek(1)} aria-label="Next week">
            ›
          </button>
          <label className="calendar-date-picker-wrap">
            <span className="calendar-date-picker-label">Go to date</span>
            <input
              type="date"
              value={datePickerValue}
              onChange={(e) => {
                const v = e.target.value
                if (v) goToDate(new Date(v))
              }}
              className="calendar-date-picker"
            />
          </label>
        </div>
        <div className="calendar-toolbar-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={openBulkAssign}
            disabled={selectedEmployeeIds.size === 0}
            title={selectedEmployeeIds.size === 0 ? 'Select employees first' : `Assign ${selectedEmployeeIds.size} employee(s) to a project for a date range`}
          >
            Bulk assign {selectedEmployeeIds.size > 0 ? `(${selectedEmployeeIds.size})` : ''}
          </button>
        </div>
      </header>

      <section className="calendar-filters schedule-filters-row">
        <input
          type="search"
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
          placeholder="Search by name…"
          className="calendar-search"
        />
        <label className="schedule-select-all">
          <input
            type="checkbox"
            ref={selectAllCheckRef}
            checked={employees.length > 0 && selectedEmployeeIds.size === employees.length}
            onChange={selectAllEmployees}
          />
          <span>Select all</span>
        </label>
      </section>

      <section className="calendar-wrap">
        <table className="calendar">
          <thead>
            <tr>
              <th className="calendar-col-select">
                <span className="calendar-col-select-label">Select</span>
              </th>
              <th className="calendar-col-employee">Employee</th>
              {days.map((day) => (
                <th key={day} className={`calendar-day-col ${isPastDate(day) ? 'calendar-day-col--past' : ''} ${isToday(day) ? 'calendar-day-col--today' : ''}`}>
                  <span className="calendar-day-name">{format(parseLocalDate(day), 'EEE')}</span>
                  <span className="calendar-day-num">{format(parseLocalDate(day), 'd')}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className={`calendar-row ${selectedEmployeeIds.has(employee.id) ? 'calendar-row--selected' : ''}`}>
                <td className="calendar-cell calendar-cell--select" onClick={(e) => e.stopPropagation()}>
                  <label className="schedule-row-check">
                    <input
                      type="checkbox"
                      checked={selectedEmployeeIds.has(employee.id)}
                      onChange={() => toggleEmployeeSelection(employee.id)}
                    />
                  </label>
                </td>
                <td className="calendar-employee-cell">{employee.name}</td>
                {days.map((day) => {
                  const c = cell(employee.id, day)
                  const isUnassigned = !c.projectName || c.type === 'UNASSIGNED'
                  const past = isPastDate(day)
                  const today = isToday(day)
                  return (
                    <td
                      key={day + '-' + employee.id}
                      className={`calendar-cell ${past ? 'calendar-cell--past' : ''} ${today ? 'calendar-cell--today' : ''}`}
                      onClick={() => !past && openEditor(employee.id, day)}
                      title={past ? 'Cannot assign to past dates' : today ? 'Today' : undefined}
                    >
                      <div className={`calendar-event ${isUnassigned ? 'calendar-event--empty' : ''}`} data-type={c.type}>
                        <span className="calendar-event-project">
                          {c.projectName || '—'}
                        </span>
                        {!isUnassigned && (c.workType || c.meetingPoint) && (
                          <span className="calendar-event-meta">
                            {[c.workType, c.meetingPoint].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {assignmentsListFiltered.length > 0 && (
        <section className="schedule-assignments-list">
          <h2 className="schedule-assignments-list-title">Assignments for this week</h2>
          <p className="schedule-assignments-list-desc">
            {isMobile ? 'Weekdays only (Mon–Fri).' : 'Jobs assigned to users in the selected week.'}
          </p>
          <div className="table-wrap">
            <table className="grid schedule-assignments-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Project</th>
                  <th>Address</th>
                  <th>Time</th>
                  <th>Work type</th>
                  <th>Meeting point</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {assignmentsListFiltered.map(({ employeeName, day, c }) => (
                  <tr key={`${day}-${employeeName}-${c.id}`}>
                    <td className="employee-cell">{employeeName}</td>
                    <td>{format(parseLocalDate(day), 'EEE, MMM d, yyyy')}</td>
                    <td>{c.type}</td>
                    <td>{c.projectName ?? '—'}</td>
                    <td>{c.address ?? '—'}</td>
                    <td>
                      {[c.startTime, c.endTime].filter(Boolean).length
                        ? [c.startTime, c.endTime].filter(Boolean).join(' – ')
                        : '—'}
                    </td>
                    <td>{c.workType ?? '—'}</td>
                    <td>{c.meetingPoint ?? '—'}</td>
                    <td>{c.notes ?? '—'}</td>
                    <td>
                      {c.id > 0 && (
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', color: '#b91c1c' }}
                          title="Remove assignment"
                          onClick={async () => {
                            if (!confirm('Remove this assignment?')) return
                            const res = await fetch(`/api/schedule/assignment/${c.id}`, { method: 'DELETE' })
                            if (!res.ok) return
                            const weekRes = await fetch(`/api/schedule/week?start=${encodeURIComponent(weekStart)}`)
                            const json = await weekRes.json()
                            setData({ days: json.days, employees: json.employees, grid: json.grid })
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {dialogState.open && (
        <div className="dialog-backdrop">
          <div className="dialog-inner">
            <h2>Edit assignment</h2>
            <p className="subtitle">
              {dialogState.date
                ? format(parseLocalDate(dialogState.date), 'EEEE, MMM d')
                : ''}
            </p>
            {assignError && <p className="login-error" style={{ margin: '0 0 0.75rem' }}>{assignError}</p>}

            <label>
              Project <span style={{ color: '#b91c1c' }}>*</span>
              <select
                value={dialogState.form.projectId}
                onChange={(e) =>
                  setDialogState((s) => ({
                    ...s,
                    form: {
                      ...s.form,
                      projectId: Number(e.target.value)
                    }
                  }))
                }
              >
                <option value={0}>Unassigned</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Type
              <select
                value={dialogState.form.type}
                onChange={(e) =>
                  setDialogState((s) => ({
                    ...s,
                    form: { ...s.form, type: e.target.value as 'DEFAULT' | 'OVERRIDE' }
                  }))
                }
              >
                <option value="DEFAULT">Default project assignment</option>
                <option value="OVERRIDE">Daily override</option>
              </select>
            </label>

            <div className="row-inline">
              <label>
                Start time <span style={{ color: '#b91c1c' }}>*</span>
                <input
                  value={dialogState.form.startTime}
                  onChange={(e) =>
                    setDialogState((s) => ({
                      ...s,
                      form: { ...s.form, startTime: e.target.value }
                    }))
                  }
                  placeholder="07:00"
                  required
                />
              </label>
              <label>
                End time <span style={{ color: '#b91c1c' }}>*</span>
                <input
                  value={dialogState.form.endTime}
                  onChange={(e) =>
                    setDialogState((s) => ({
                      ...s,
                      form: { ...s.form, endTime: e.target.value }
                    }))
                  }
                  placeholder="15:30"
                  required
                />
              </label>
            </div>

            <label>
              Work type
              <input
                value={dialogState.form.workType}
                onChange={(e) =>
                  setDialogState((s) => ({
                    ...s,
                    form: { ...s.form, workType: e.target.value }
                  }))
                }
                placeholder="Service call, rough-in, trim…"
              />
            </label>

            <label>
              Meeting point
              <input
                value={dialogState.form.meetingPoint}
                onChange={(e) =>
                  setDialogState((s) => ({
                    ...s,
                    form: { ...s.form, meetingPoint: e.target.value }
                  }))
                }
                placeholder="Shop, jobsite, office…"
              />
            </label>

            <label>
              Notes
              <textarea
                value={dialogState.form.notes}
                onChange={(e) =>
                  setDialogState((s) => ({
                    ...s,
                    form: { ...s.form, notes: e.target.value }
                  }))
                }
                rows={3}
                placeholder="Parking, access, gate code, materials pickup, PPE…"
              />
            </label>

            <div className="dialog-actions">
              {dialogState.assignmentId > 0 && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ marginRight: 'auto', color: '#b91c1c' }}
                  onClick={async () => {
                    if (!confirm('Remove this assignment? The slot will be cleared.')) return
                    const res = await fetch(`/api/schedule/assignment/${dialogState.assignmentId}`, { method: 'DELETE' })
                    if (!res.ok) {
                      alert('Failed to remove assignment')
                      return
                    }
                    const weekRes = await fetch(`/api/schedule/week?start=${encodeURIComponent(weekStart)}`)
                    const json = await weekRes.json()
                    setData({ days: json.days, employees: json.employees, grid: json.grid })
                    closeDialog()
                  }}
                >
                  Remove assignment
                </button>
              )}
              <button type="button" className="btn-secondary" onClick={closeDialog}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={saveEdit}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkOpen && (
        <div className="dialog-backdrop" onClick={() => !bulkSaving && setBulkOpen(false)}>
          <div className="dialog-inner dialog-inner--wide" onClick={(e) => e.stopPropagation()}>
            <h2>Bulk assign</h2>
            <p className="subtitle">
              Assign {selectedEmployeeIds.size} employee{selectedEmployeeIds.size !== 1 ? 's' : ''} to a project for a date range.
            </p>

            <label>
              Project
              <select
                value={bulkForm.projectId}
                onChange={(e) => setBulkForm((f) => ({ ...f, projectId: Number(e.target.value) }))}
              >
                <option value={0}>Unassigned (clear assignments)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="row-inline">
              <label>
                Start date
                <input
                  type="date"
                  value={bulkForm.startDate}
                  onChange={(e) => setBulkForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </label>
              <label>
                End date
                <input
                  type="date"
                  value={bulkForm.endDate}
                  onChange={(e) => setBulkForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </label>
            </div>

            <label>
              Type
              <select
                value={bulkForm.type}
                onChange={(e) =>
                  setBulkForm((f) => ({ ...f, type: e.target.value as 'DEFAULT' | 'OVERRIDE' }))
                }
              >
                <option value="DEFAULT">Default</option>
                <option value="OVERRIDE">Daily override</option>
              </select>
            </label>

            <div className="row-inline">
              <label>
                Start time
                <input
                  value={bulkForm.startTime}
                  onChange={(e) => setBulkForm((f) => ({ ...f, startTime: e.target.value }))}
                  placeholder="07:00"
                />
              </label>
              <label>
                End time
                <input
                  value={bulkForm.endTime}
                  onChange={(e) => setBulkForm((f) => ({ ...f, endTime: e.target.value }))}
                  placeholder="15:30"
                />
              </label>
            </div>

            <label>
              Work type
              <input
                value={bulkForm.workType}
                onChange={(e) => setBulkForm((f) => ({ ...f, workType: e.target.value }))}
                placeholder="Optional"
              />
            </label>

            <label>
              Meeting point
              <input
                value={bulkForm.meetingPoint}
                onChange={(e) => setBulkForm((f) => ({ ...f, meetingPoint: e.target.value }))}
                placeholder="Optional"
              />
            </label>

            <label>
              Notes
              <textarea
                value={bulkForm.notes}
                onChange={(e) => setBulkForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Optional"
              />
            </label>

            <div className="dialog-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => !bulkSaving && setBulkOpen(false)}
                disabled={bulkSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={saveBulkAssign}
                disabled={bulkSaving}
              >
                {bulkSaving ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

