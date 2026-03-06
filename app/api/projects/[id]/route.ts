export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { prisma } = await import('../../../../lib/prisma')
  const { requireManagementUser } = await import('../../../../lib/auth')
  await requireManagementUser()

  const { id } = await params
  const idNum = Number(id)
  if (!id || Number.isNaN(idNum)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const project = await prisma.project.findUnique({
    where: { id: idNum },
    select: { id: true }
  })
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  await prisma.assignment.updateMany({
    where: { projectId: idNum },
    data: { projectId: null }
  })
  await prisma.project.delete({ where: { id: idNum } })
  return NextResponse.json({ ok: true })
}
