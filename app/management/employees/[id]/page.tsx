'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'

type Employee = { id: number; name: string; email: string; role: string; phone: string | null; trade: string | null; defaultLocation: string | null }
type Assignment = {
  id: number
  date: string
  type: string
  projectName: string | null
  address: string | null
  startTime: string | null
  endTime: string | null
  workType: string | null
  meetingPoint: string | null
  notes: string | null
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    if (!id) return
    const from = dateFrom || undefined
    const to = dateTo || undefined
    const q = new URLSearchParams()
    if (from) q.set('from', from)
    if (to) q.set('to', to)
    const url = `/api/employees/${id}?${q.toString()}`
    setLoading(true)
    fetch(url)
      .then((r) => {
        if (r.status === 404) return null
        return r.json()
      })
      .then((data) => {
        if (!data) {
          setEmployee(null)
          setAssignments([])
          return
        }
        setEmployee(data.employee)
        setAssignments(data.assignments ?? [])
      })
      .catch(() => {
        setEmployee(null)
        setAssignments([])
      })
      .finally(() => setLoading(false))
  }, [id, dateFrom, dateTo])

  function exportEmployeeCsv() {
    if (!employee) return
    const headers = ['Date', 'Type', 'Project', 'Address', 'Start', 'End', 'Work type', 'Meeting point', 'Notes']
    const rows = assignments.map((a) => [
      a.date,
      a.type,
      a.projectName ?? '',
      a.address ?? '',
      a.startTime ?? '',
      a.endTime ?? '',
      a.workType ?? '',
      a.meetingPoint ?? '',
      (a.notes ?? '').replace(/"/g, '""')
    ])
    const csv = [
      `Employee,${employee.name}`,
      `Email,${employee.email}`,
      `Role,${employee.role}`,
      '',
      headers.join(','),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `employee-${employee.name.replace(/\s+/g, '-')}-${employee.id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && !employee) {
    return (
      <div className="page">
        <p>Loading…</p>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="page">
        <p>Employee not found.</p>
        <button type="button" className="btn-secondary" onClick={() => router.push('/management/employees')}>
          Back to Users
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.push('/management/employees')}
            style={{ marginBottom: '0.5rem' }}
          >
            ← Back to Users
          </button>
          <h1 className="dashboard-page-title">{employee.name}</h1>
          <p className="subtitle">{employee.email} · {employee.role === 'MANAGEMENT' ? 'Admin' : 'Employee'}</p>
        </div>
        <button type="button" className="btn-primary" onClick={exportEmployeeCsv}>
          Export data (CSV)
        </button>
      </header>

      <section className="filters" style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ padding: '0.4rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ padding: '0.4rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
          />
        </label>
      </section>

      <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Assignments</h2>
      {assignments.length === 0 ? (
        <p style={{ color: '#64748b' }}>No assignments in this range.</p>
      ) : (
        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Project</th>
                <th>Address</th>
                <th>Time</th>
                <th>Work type</th>
                <th>Meeting point</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td>{format(new Date(a.date), 'EEE, MMM d, yyyy')}</td>
                  <td>{a.type}</td>
                  <td>{a.projectName ?? '—'}</td>
                  <td>{a.address ?? '—'}</td>
                  <td>{(a.startTime || a.endTime) ? `${a.startTime || '—'} – ${a.endTime || '—'}` : '—'}</td>
                  <td>{a.workType ?? '—'}</td>
                  <td>{a.meetingPoint ?? '—'}</td>
                  <td>{a.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
