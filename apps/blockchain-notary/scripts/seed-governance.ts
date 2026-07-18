import { PrismaClient } from "@prisma/client";

async function main() {
  console.log("🌱 SEEDING GOVERNANCE MEMBERS AND WALLETS...");
  const prisma = new PrismaClient();

  const data = [
    {
      email: "anciano@amazonia.com",
      userId: "c916a0f6-18e3-42bd-9067-d7b9fc805725",
      wallet: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Account #0 (Elder/Deployer)
      role: "ELDER"
    },
    {
      email: "vende@gmail.com",
      userId: "154f7737-efca-48c3-bece-927273d44ede",
      wallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account #1 (Member)
      role: "MEMBER"
    },
    {
      email: "vendedor1@amazonia.com",
      userId: "55ad1d35-d0d2-45c4-8afd-0350ac4894d7",
      wallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Account #2 (Member)
      role: "MEMBER"
    },
    {
      email: "vendedor2@amazonia.com",
      userId: "5f8497b3-2d8b-41f4-85db-4c300f2f10f7",
      wallet: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Account #3 (Member)
      role: "MEMBER"
    }
  ];

  for (const m of data) {
    console.log(`Setting wallet for ${m.email}...`);
    // Update user_account table in Neon Postgres directly
    await prisma.$executeRawUnsafe(`
      UPDATE user_account SET wallet_hash = '${m.wallet}' WHERE id = '${m.userId}'::uuid;
    `);

    console.log(`Upserting governance member for ${m.email} (${m.role})...`);
    await prisma.governanceMember.upsert({
      where: { userId: m.userId },
      update: {
        walletAddress: m.wallet,
        role: m.role as any,
        assignedBy: "SYSTEM"
      },
      create: {
        userId: m.userId,
        walletAddress: m.wallet,
        role: m.role as any,
        assignedBy: "SYSTEM"
      }
    });
  }

  console.log("✅ Done seeding!");
  await prisma.$disconnect();
}

main().catch(console.error);
