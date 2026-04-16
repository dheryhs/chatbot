import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const sessions = await prisma.session.findMany()
  console.log("DB Sessions:", sessions)
  
  const agents = await prisma.agent.findMany()
  console.log("DB Agents:", agents.map(a => ({id: a.id, name: a.name, isActive: a.isActive, sessionBindings: a.sessionBindings})))
  
  await prisma.$disconnect()
}

main()
