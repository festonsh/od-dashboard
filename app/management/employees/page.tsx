'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Employee = { id: number; name: string; email: string; role: string }

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | null>(null)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [searchName, setSearchName] = useState('')

  const filtered = useMemo(() => {
    const list = [...(employees ?? [])].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    if (!searchName.trim()) return list
    const q = searchName.trim().toLowerCase()
    return list.filter((e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q))
  }, [employees, searchName])

  function load() {
    setLoading(true)
    fetch('/api/employees')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setEmployees(data.employees ?? []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  function exportAllCsv() {
    const headers = ['Name', 'Email', 'Role']
    const rows = filtered.map((e) => [e.name, e.email, e.role === 'MANAGEMENT' ? 'Admin' : 'Employee'])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page">
      <header className="header">
        <h1 className="dashboard-page-title">Users</h1>
        <div className="actions">
          <button type="button" className="btn-secondary" onClick={exportAllCsv} disabled={filtered.length === 0}>
            Export CSV (all)
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditing(null)
              setModal('add')
            }}
          >
            Add user
          </button>
        </div>
      </header>

      <div className="filters" style={{ marginBottom: '1rem' }}>
        <input
          type="search"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          placeholder="Search by name or email…"
          className="calendar-search"
          style={{ minWidth: '220px' }}
        />
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Access (role)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td className="employee-cell">{e.name}</td>
                  <td>{e.email}</td>
                  <td>{e.role === 'MANAGEMENT' ? 'Admin / Management' : 'Employee'}</td>
                  <td>
                    <Link
                      href={`/management/employees/${e.id}`}
                      className="btn-icon"
                      title="View / export"
                      aria-label="View and export"
                    >
                      👁
                    </Link>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setEditing(e)
                        setModal(null)
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(modal === 'add' || editing) && (
        <UserForm
          user={editing}
          onClose={() => {
            setModal(null)
            setEditing(null)
          }}
          onSaved={() => {
            load()
            setModal(null)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function UserForm({
  user,
  onClose,
  onSaved
}: {
  user: Employee | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [role, setRole] = useState<'EMPLOYEE' | 'MANAGEMENT'>(user ? (user.role === 'MANAGEMENT' ? 'MANAGEMENT' : 'EMPLOYEE') : 'EMPLOYEE')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!user

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.')
      return
    }
    if (!isEdit && !password) {
      setError('Password is required for new users (min 6 characters).')
      return
    }
    if (password && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = isEdit
        ? { id: user.id, name: name.trim(), email: email.trim(), role, password: password || undefined }
        : { name: name.trim(), email: email.trim(), role, password }
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to save.')
        return
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog-inner" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: 0 }}>{isEdit ? 'Edit user' : 'Add user'}</h2>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
          Set access (role): <strong>Employee</strong> sees only their schedule; <strong>Admin / Management</strong> can manage projects, schedule, and users.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label>
            Full name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </label>
          <label>
            Access (role)
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'EMPLOYEE' | 'MANAGEMENT')}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGEMENT">Admin / Management</option>
            </select>
          </label>
          <label>
            {isEdit ? 'New password (leave blank to keep current)' : 'Password'}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? 'Leave blank to keep' : 'Min 6 characters'}
              minLength={isEdit ? 0 : 6}
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <div className="dialog-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save' : 'Add user'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
