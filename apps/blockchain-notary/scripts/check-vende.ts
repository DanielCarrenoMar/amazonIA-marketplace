import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const users = await prisma.$queryRaw`
    SELECT id, email, full_name AS "fullName", wallet_hash AS "walletHash" FROM user_account 
    WHERE email IN ('anciano@amazonia.com', 'vende@gmail.com', 'vendedor1@amazonia.com', 'vendedor2@amazonia.com')
  `;
  console.log("USERS WITH WALLETS:", users);
  await prisma.$disconnect();
}

main().catch(console.error);
