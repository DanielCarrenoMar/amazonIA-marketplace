const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.userAccount.findMany({
    where: { email: { contains: 'vende' } }
  });
  console.log('--- USER ACCOUNTS CONTAINING VENDE ---');
  console.log(users);

  const members = await prisma.governanceMember.findMany();
  console.log('--- GOVERNANCE MEMBERS ---');
  console.log(members);
  
  await prisma.$disconnect();
}

main().catch(console.error);
