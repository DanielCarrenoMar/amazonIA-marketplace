import { ethers } from "hardhat";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("\n=========================================");
  console.log("⚙️  SINCRONIZADOR DE GOBERNANZA - ON-CHAIN");
  console.log("=========================================\n");

  const prisma = new PrismaClient();
  const members = await prisma.governanceMember.findMany({
    where: { role: { in: ["MEMBER", "ELDER"] } }
  });

  console.log(`🔎 Encontrados ${members.length} miembros en la base de datos para sincronizar:`);
  for (const m of members) {
    console.log(`   • ID: ${m.userId} | Rol: ${m.role} | Wallet: ${m.walletAddress}`);
  }
  console.log("");

  const contractAddress = process.env.GOVERNANCE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const provider = ethers.provider;

  // Verificar si hay código desplegado
  const code = await provider.getCode(contractAddress);
  if (code === "0x" || code === "0x0") {
    console.error(`❌ [ERROR] No hay ningún contrato de Gobernanza desplegado en: ${contractAddress}`);
    console.error(`   Asegúrate de que Hardhat esté encendido y los contratos desplegados.`);
    await prisma.$disconnect();
    return;
  }

  const [deployer] = await ethers.getSigners();
  console.log(`🔑 Remitente (Elder/Deployer): ${deployer.address}`);
  console.log(`📜 Conectando con GovernanceRegistry en: ${contractAddress}`);

  const govContract = await ethers.getContractAt("GovernanceRegistry", contractAddress);

  for (const member of members) {
    const roleValue = member.role === "ELDER" ? 2 : 1; // 1 = MEMBER, 2 = ELDER

    // Comprobar rol actual en la blockchain para no gastar gas de más
    const currentOnChainRole = await govContract.roles(member.walletAddress);
    
    if (Number(currentOnChainRole) === roleValue) {
      console.log(`✅ [YA SINCRONIZADO] ${member.userId} ya tiene el rol correcto (${member.role}) on-chain.`);
      continue;
    }

    console.log(`⚡ Sincronizando en la blockchain: ${member.userId} → Rol ${member.role} (${member.walletAddress})...`);
    try {
      const tx = await govContract.assignRole(
        member.walletAddress,
        member.userId,
        roleValue
      );
      await tx.wait();
      console.log(`   👉 Éxito: Rol asignado en la transacción ${tx.hash}`);
    } catch (err: any) {
      console.error(`   ❌ Error al asignar rol on-chain: ${err.message}`);
    }
  }

  console.log("\n=========================================");
  console.log("✅ Proceso de sincronización completado.");
  console.log("=========================================\n");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
