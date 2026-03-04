'use client'

import { useEffect, useMemo, useState } from 'react'
import { addDays, format, startOfWeek } from 'date-fns'

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

export default function SchedulePage() {
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

  const [dialogState, setDialogState] = useState<{
    open: boolean
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

  function openEditor(employeeId: number, day: string) {
    const existing = cell(employeeId, day)
    setDialogState({
      open: true,
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
    setDialogState((s) => ({ ...s, open: false }))
  }

  async function saveEdit() {
    if (!dialogState.employeeId || !dialogState.date) return
    await fetch('/api/schedule/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: dialogState.employeeId,
        date: dialogState.date,
        projectId: dialogState.form.projectId || null,
        type: dialogState.form.type,
        startTime: dialogState.form.startTime || null,
        endTime: dialogState.form.endTime || null,
        workType: dialogState.form.workType || null,
        meetingPoint: dialogState.form.meetingPoint || null,
        notes: dialogState.form.notes || null
      })
    })

    // Refresh week data
    const res = await fetch(`/api/schedule/week?start=${encodeURIComponent(weekStart)}`)
    const json = await res.json()
    setData({ days: json.days, employees: json.employees, grid: json.grid })
    closeDialog()
  }

  const formattedWeekStart = data?.weekStart
    ? format(new Date(data.weekStart), 'MMM d, yyyy')
    : ''

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Weekly schedule</h1>
          <p className="subtitle">Week of {formattedWeekStart}</p>
        </div>
        <div className="actions">
          <button onClick={() => shiftWeek(-1)}>Previous week</button>
          <button onClick={resetWeek}>Current week</button>
          <button onClick={() => shiftWeek(1)}>Next week</button>
        </div>
      </header>

      <section className="filters">
        <label>
          Filter by name
          <input
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            placeholder="Search employees"
          />
        </label>
      </section>

      <section className="grid-wrapper">
        <table className="grid">
          <thead>
            <tr>
              <th>Employee</th>
              {days.map((day) => (
                <th key={day}>{format(new Date(day), 'EEE d')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td className="employee-cell">{employee.name}</td>
                {days.map((day) => {
                  const c = cell(employee.id, day)
                  return (
                    <td
                      key={day + '-' + employee.id}
                      className="cell"
                      onClick={() => openEditor(employee.id, day)}
                    >
                      <div className="assignment" data-type={c.type}>
                        <span className="project">
                          {c.projectName || 'Unassigned'}
                        </span>
                        {c.workType && (
                          <span className="work">{c.workType}</span>
                        )}
                        {c.meetingPoint && (
                          <span className="meta">{c.meetingPoint}</span>
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

      {dialogState.open && (
        <div className="dialog-backdrop">
          <div className="dialog-inner">
            <h2>Edit assignment</h2>
            <p className="subtitle">
              {dialogState.date
                ? format(new Date(dialogState.date), 'EEEE, MMM d')
                : ''}
            </p>

            <label>
              Project
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
                Start time
                <input
                  value={dialogState.form.startTime}
                  onChange={(e) =>
                    setDialogState((s) => ({
                      ...s,
                      form: { ...s.form, startTime: e.target.value }
                    }))
                  }
                  placeholder="07:00"
                />
              </label>
              <label>
                End time
                <input
                  value={dialogState.form.endTime}
                  onChange={(e) =>
                    setDialogState((s) => ({
                      ...s,
                      form: { ...s.form, endTime: e.target.value }
                    }))
                  }
                  placeholder="15:30"
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
              <button type="button" onClick={closeDialog}>
                Cancel
              </button>
              <button type="button" onClick={saveEdit}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

