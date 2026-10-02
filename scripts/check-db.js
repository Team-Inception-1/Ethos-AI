const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('DB_SUCCESS: Neon PostgreSQL connected successfully!', result);
    const userCount = await prisma.user.count();
    console.log(`Current User count in DB: ${userCount}`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('DB_ERROR: Failed to connect to database:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

check();
