import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const targets = [
  '4d2b9958-6088-4bb2-bb83-d55bfa7c9f4e',
  '0604f931-7c37-4d2e-81e6-e96c8f03854c',
  'a96e9777-c281-4f5a-a4a2-df9158d4f2fb',
  '92e57986-282d-480f-9817-2d9ba199ab62',
  '89e8177b-6ef4-4599-bf57-beeffa7c8d60'
];

async function main() {
  const orders = await prisma.productOrder.findMany({
    where: {
      id: {
        in: targets
      }
    },
    select: {
      id: true,
      transportType: true,
      currentStatus: true
    }
  });

  console.log('Target orders transport types:');
  console.log(JSON.stringify(orders, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
