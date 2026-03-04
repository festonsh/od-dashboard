'use client'

import { useEffect, useState } from 'react'

type Project = {
  id: number
  name: string
  address: string
  status: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setProjects(data.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <header className="header">
        <h1>Projects</h1>
      </header>
      <p>For now, manage projects via the API or database; UI editing can be expanded here.</p>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul>
          {projects.map((p) => (
            <li key={p.id}>
              <strong>{p.name}</strong> – {p.address} ({p.status})
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
