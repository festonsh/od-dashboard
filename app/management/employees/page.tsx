import { prisma } from '../../../lib/prisma'
import { requireManagementUser } from '../../../lib/auth'

export default async function EmployeesPage() {
  await requireManagementUser()
  const employees = await prisma.user.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="page">
      <header className="header">
        <h1>Employees</h1>
      </header>
      <ul>
        {employees.map((e) => (
          <li key={e.id}>
            <strong>{e.name}</strong> – {e.email} ({e.role})
          </li>
        ))}
      </ul>
    </div>
  )
}

