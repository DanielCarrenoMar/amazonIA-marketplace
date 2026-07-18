import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("\n=========================================");
  console.log("🔎 VERIFICADOR DE BLOCKCHAIN - AMAZONIA");
  console.log("=========================================\n");
  
  // 1. Verificar Conexión y Proveedor
  try {
    const provider = ethers.provider;
    const network = await provider.getNetwork();
    console.log(`✅ [CONEXIÓN] Conectado con éxito a la red local.`);
    console.log(`   • Network Name : ${network.name}`);
    console.log(`   • Chain ID     : ${network.chainId}`);
    
    // 2. Cuentas locales
    const signers = await ethers.getSigners();
    console.log(`✅ [CUENTAS] Cuentas de Hardhat detectadas: ${signers.length}`);
    const balance0 = await provider.getBalance(signers[0].address);
    console.log(`   • Cuenta #0 (Elder) : ${signers[0].address}`);
    console.log(`   • Saldo Cuenta #0   : ${ethers.formatEther(balance0)} ETH`);
    
    const balance1 = await provider.getBalance(signers[1].address);
    console.log(`   • Cuenta #1 (Member): ${signers[1].address}`);
    console.log(`   • Saldo Cuenta #1   : ${ethers.formatEther(balance1)} ETH`);

    // 3. Obtener direcciones del archivo .env o defaults
    const govAddress = process.env.GOVERNANCE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const nftAddress = process.env.NFT_FACTORY_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

    console.log("\n=========================================");
    console.log("📜 CONTRATOS INTELIGENTES DESPLEGADOS");
    console.log("=========================================\n");

    // Verificar GovernanceRegistry
    const govCode = await provider.getCode(govAddress);
    if (govCode === "0x" || govCode === "0x0") {
      console.log(`❌ [ERROR] No hay código desplegado en la dirección de Gobernanza: ${govAddress}`);
      console.log(`   👉 Recuerda ejecutar primero: pnpm run hardhat run scripts/deploy-all.ts --network localhost`);
    } else {
      console.log(`✅ [OK] GovernanceRegistry detectado en: ${govAddress}`);
      try {
        const govContract = await ethers.getContractAt("GovernanceRegistry", govAddress);
        const elder = await govContract.elder();
        console.log(`   • Dirección del Elder en el contrato: ${elder}`);
        console.log(`   • Estado del contrato              : Activo y consultable`);
      } catch (err: any) {
        console.log(`   ⚠️  No se pudo leer el estado del contrato de gobernanza: ${err.message}`);
      }
    }

    // Verificar ArtisanNFTFactory
    const nftCode = await provider.getCode(nftAddress);
    if (nftCode === "0x" || nftCode === "0x0") {
      console.log(`❌ [ERROR] No hay código desplegado en la dirección de la Fábrica NFT: ${nftAddress}`);
      console.log(`   👉 Recuerda ejecutar primero: pnpm run hardhat run scripts/deploy-all.ts --network localhost`);
    } else {
      console.log(`✅ [OK] ArtisanNFTFactory detectado en: ${nftAddress}`);
      try {
        const nftContract = await ethers.getContractAt("ArtisanNFTFactory", nftAddress);
        // Query mapping for account 0
        const collection = await nftContract.artisanToCollection(signers[0].address);
        console.log(`   • Colección del artesano de prueba : ${collection === ethers.ZeroAddress ? "Ninguna creada aún" : collection}`);
        console.log(`   • Estado de la fábrica             : Activa y consultable`);
      } catch (err: any) {
        console.log(`   ⚠️  No se pudo leer el estado de la fábrica NFT: ${err.message}`);
      }
    }
  } catch (error: any) {
    console.log("❌ [ERROR CRÍTICO] La red local de Hardhat no está respondiendo.");
    console.log("   👉 Asegúrate de haber iniciado el batch con: start-amazonia.bat");
    console.log("   👉 O inicia el nodo manualmente con: pnpm --filter blockchain-notary run hardhat node");
  }
  console.log("\n=========================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
