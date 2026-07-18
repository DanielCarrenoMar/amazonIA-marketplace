require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== LIMPIANDO REGISTROS DE BLOCKCHAIN LOCAL EN BD ===\n');

  // 1. Eliminar todos los votos anteriores
  console.log('  → Eliminando votos...');
  const deletedVotes = await prisma.vote.deleteMany({});
  console.log(`    ✅ ${deletedVotes.count} votos eliminados.`);

  // 2. Eliminar todas las propuestas anteriores
  console.log('  → Eliminando propuestas...');
  const deletedProposals = await prisma.proposal.deleteMany({});
  console.log(`    ✅ ${deletedProposals.count} propuestas eliminadas.`);

  // 3. Reiniciar el estado de los BlockchainRecords a FAILED o eliminarlos para poder re-notarizar
  console.log('  → Limpiando registros de seguimiento de compras (BlockchainRecord)...');
  const deletedRecords = await prisma.blockchainRecord.deleteMany({});
  console.log(`    ✅ ${deletedRecords.count} registros de seguimiento eliminados.`);

  console.log('\n✅ ¡Limpieza completada con éxito!');
  console.log('   Ya puedes interactuar con tu nodo de Hardhat recién iniciado de forma limpia.');

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
