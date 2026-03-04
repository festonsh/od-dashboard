import { prisma } from '../../../lib/prisma'
import { requireManagementUser } from '../../../lib/auth'

export default async function ProjectsPage() {
  await requireManagementUser()
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' }
  })

  // Form is handled client-side via a simple HTML form posting to the API.

  return (
    <div className="page">
      <header className="header">
        <h1>Projects</h1>
      </header>
      <p>For now, manage projects via the API or database; UI editing can be expanded here.</p>
      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            <strong>{p.name}</strong> – {p.address} ({p.status})
          </li>
        ))}
      </ul>
    </div>
  )
}

