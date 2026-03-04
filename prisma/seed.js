const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const ADMIN_EMAIL = 'odetacocaj27@gmail.com'
const ADMIN_PASSWORD = 'odadmin'

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, name: 'Admin', role: 'MANAGEMENT' },
    create: {
      name: 'Admin',
      email: ADMIN_EMAIL,
      role: 'MANAGEMENT',
      passwordHash
    }
  })
  console.log('Admin user ready:', admin.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
