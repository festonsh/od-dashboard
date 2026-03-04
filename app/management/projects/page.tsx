'use client'

import { useEffect, useState } from 'react'

type Project = {
  id: number
  name: string
  description: string | null
  customer: string | null
  contact: string | null
  address: string
  startDate: string | null
  endDate: string | null
  notes: string | null
  status: string
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' }
] as const

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE')
  const [modal, setModal] = useState<'add' | null>(null)
  const [editing, setEditing] = useState<Project | null>(null)

  function load() {
    setLoading(true)
    const url = statusFilter && statusFilter !== 'ALL' ? `/api/projects?status=${statusFilter}` : '/api/projects?status=ALL'
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setProjects(data.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [statusFilter])

  return (
    <div className="page">
      <header className="header">
        <h1 className="dashboard-page-title">Projects</h1>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setEditing(null)
            setModal('add')
          }}
        >
          Add project
        </button>
      </header>

      <div className="filters" style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.4rem 0.6rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
          >
            <option value="ALL">All</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : projects.length === 0 ? (
        <p style={{ color: '#64748b' }}>No projects yet. Click “Add project” to create one.</p>
      ) : (
        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td className="employee-cell">{p.name}</td>
                  <td>{p.address}</td>
                  <td>{STATUS_OPTIONS.find((o) => o.value === p.status)?.label ?? p.status}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setEditing(p)
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
        <ProjectForm
          project={editing}
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

function ProjectForm({
  project,
  onClose,
  onSaved
}: {
  project: Project | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [customer, setCustomer] = useState(project?.customer ?? '')
  const [contact, setContact] = useState(project?.contact ?? '')
  const [address, setAddress] = useState(project?.address ?? '')
  const [startDate, setStartDate] = useState(project?.startDate ? project.startDate.slice(0, 10) : '')
  const [endDate, setEndDate] = useState(project?.endDate ? project.endDate.slice(0, 10) : '')
  const [notes, setNotes] = useState(project?.notes ?? '')
  const [status, setStatus] = useState<string>(project?.status ?? 'ACTIVE')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!project

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !address.trim()) {
      setError('Project name and address are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = {
        ...(isEdit && { id: project.id }),
        name: name.trim(),
        description: description.trim() || null,
        customer: customer.trim() || null,
        contact: contact.trim() || null,
        address: address.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        notes: notes.trim() || null,
        status: status as 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'ARCHIVED'
      }
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to save project.')
        return
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog-inner dialog-inner--wide" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: 0 }}>{isEdit ? 'Edit project' : 'Add project'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label>
            Project name *
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Warehouse Rewire"
              required
            />
          </label>
          <label>
            Address / location *
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address"
              required
            />
          </label>
          <label>
            Short description
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
            />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label>
              Customer / site contact
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Optional"
              />
            </label>
            <label>
              Contact
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Phone or email"
              />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label>
              Start date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>
              End date
            <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
          </div>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Notes (parking, access, materials, etc.)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              rows={3}
              style={{ resize: 'vertical', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <div className="dialog-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save' : 'Add project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
