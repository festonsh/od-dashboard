'use client'

import { useEffect, useState } from 'react'

type Employee = { id: number; name: string; email: string; role: string }

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/employees')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setEmployees(data.employees ?? []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <header className="header">
        <h1>Employees</h1>
      </header>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul>
          {employees.map((e) => (
            <li key={e.id}>
              <strong>{e.name}</strong> – {e.email} ({e.role})
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
