import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '../../.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const VZLA_COORDS = [
  { lat: 10.4806, lon: -66.9036, city: 'Caracas', region: 'Distrito Capital' },
  { lat: 8.3582, lon: -62.6468, city: 'Ciudad Guayana', region: 'Estado Bolívar' },
  { lat: 10.1620, lon: -68.0077, city: 'Valencia', region: 'Carabobo' },
  { lat: 10.6427, lon: -71.6125, city: 'Maracaibo', region: 'Zulia' },
  { lat: 10.0678, lon: -69.3146, city: 'Barquisimeto', region: 'Lara' }
];

function getRandomCoord() {
  return VZLA_COORDS[Math.floor(Math.random() * VZLA_COORDS.length)];
}

async function main() {
  console.log('Starting coordinates backfill...');

  // Get all orders to process
  const orders = await prisma.productOrder.findMany({
    select: { id: true, originCity: true, destinationCity: true }
  });

  console.log(`Found ${orders.length} orders in total.`);

  let updatedCount = 0;

  for (const order of orders) {
    const origin = getRandomCoord();
    let dest = getRandomCoord();
    
    // Avoid origin == dest if possible
    while (dest.city === origin.city && VZLA_COORDS.length > 1) {
      dest = getRandomCoord();
    }

    // Update origin and destination coordinates using PostGIS ST_SetSRID and ST_MakePoint
    // PostGIS format is ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    await prisma.$executeRawUnsafe(`
      UPDATE "product_order"
      SET 
        "origin_coords" = ST_SetSRID(ST_MakePoint(${origin.lon}, ${origin.lat}), 4326),
        "origin_city" = COALESCE("origin_city", '${origin.city}'),
        "origin_region" = COALESCE("origin_region", '${origin.region}'),
        "destination_coords" = ST_SetSRID(ST_MakePoint(${dest.lon}, ${dest.lat}), 4326),
        "destination_city" = COALESCE("destination_city", '${dest.city}'),
        "destination_region" = COALESCE("destination_region", '${dest.region}')
      WHERE "id" = '${order.id}';
    `);

    updatedCount++;
    console.log(`Updated order ${order.id} with Origin: ${origin.city}, Dest: ${dest.city}`);
  }

  console.log(`Successfully updated ${updatedCount} orders with new coordinates.`);
}

main()
  .catch((e) => {
    console.error('Error during backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
