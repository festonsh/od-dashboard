'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ManagementDashboardPage() {
  const [stats, setStats] = useState<{ employees: number; projects: number; activeProjects: number } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/employees').then((r) => (r.ok ? r.json() : { employees: [] })),
      fetch('/api/projects').then((r) => (r.ok ? r.json() : { projects: [] }))
    ])
      .then(([emp, proj]) => {
        const employees = emp.employees?.length ?? 0
        const projects = proj.projects?.length ?? 0
        const activeProjects = proj.projects?.filter((p: { status: string }) => p.status === 'ACTIVE').length ?? 0
        setStats({ employees, projects, activeProjects })
      })
      .catch(() => setStats({ employees: 0, projects: 0, activeProjects: 0 }))
  }, [])

  return (
    <div className="page">
      <h1 className="dashboard-page-title">Admin Dashboard</h1>
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Employees</h3>
          <p>{stats?.employees ?? '…'}</p>
          <Link href="/management/employees" style={{ fontSize: '0.9rem', marginTop: '0.5rem', display: 'inline-block' }}>
            Manage users →
          </Link>
        </div>
        <div className="dashboard-card">
          <h3>Active projects</h3>
          <p>{stats?.activeProjects ?? '…'} of {stats?.projects ?? '…'} total</p>
          <Link href="/management/projects" style={{ fontSize: '0.9rem', marginTop: '0.5rem', display: 'inline-block' }}>
            View projects →
          </Link>
        </div>
        <div className="dashboard-card">
          <h3>Weekly schedule</h3>
          <p>Assign employees to projects and daily overrides</p>
          <Link href="/management/schedule" style={{ fontSize: '0.9rem', marginTop: '0.5rem', display: 'inline-block' }}>
            Open schedule →
          </Link>
        </div>
      </div>
    </div>
  )
}
