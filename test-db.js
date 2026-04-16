const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function main() {
  try {
    const users = await prisma.user.findMany()
    console.log("Success! Users found:", users.length)
  } catch (e) {
    console.error("Connection failed:", e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
