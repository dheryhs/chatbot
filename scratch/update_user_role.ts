import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'dheryhs@gmail.com'
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    })
    console.log(`Success: User ${email} role changed to ${user.role}`)
  } catch (error) {
    console.error(`Error updating user ${email}:`, error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
