/**
 * AmazonIA Marketplace — Database Seed
 * Run with: pnpm prisma db seed
 *
 * Order of insertion (respects FK constraints):
 *  1. Tribes
 *  2. UserAccounts (buyers + sellers)
 *  3. Sellers (extend some UserAccounts)
 *  4. ProductCategories
 *  5. Products (with PostGIS coords injected via raw SQL)
 *  6. ProductRatings (+ auto-recalulates averageRating on Product)
 *  7. ProductOrders + OrderStatusHistory
 */

import 'reflect-metadata';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { UserRole } from 'event-types';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { ShipmentEventSchema } from 'database';
import crypto from 'crypto';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter }) as any;
const SALT_ROUNDS = 12;

const ShipmentEventModel = mongoose.models.ShipmentEventDocument || mongoose.model('ShipmentEventDocument', ShipmentEventSchema);

async function main() {
  console.log('🌱 Starting seed...\n');

  // ──────────────────────────────────────────────
  // 1. TRIBES
  // ──────────────────────────────────────────────
  console.log('  → Tribes...');
  const [tribeTech, tribeFashion, tribeHome, tribeFood] = await Promise.all([
    prisma.tribe.upsert({
      where: { id: 1 },
      update: {},
      create: { name: 'Tribu Tecnología', description: 'Gadgets, electronics and tech enthusiasts' },
    }),
    prisma.tribe.upsert({
      where: { id: 2 },
      update: {},
      create: { name: 'Tribu Moda', description: 'Clothing, shoes and fashion accessories' },
    }),
    prisma.tribe.upsert({
      where: { id: 3 },
      update: {},
      create: { name: 'Tribu Hogar', description: 'Furniture, decor and home improvement' },
    }),
    prisma.tribe.upsert({
      where: { id: 4 },
      update: {},
      create: { name: 'Tribu Gastronomía', description: 'Local food, organic products and snacks' },
    }),
  ]);

  // ──────────────────────────────────────────────
  // 2. USER ACCOUNTS
  // ──────────────────────────────────────────────
  console.log('  → UserAccounts...');
  const password = await bcrypt.hash('Password123!', SALT_ROUNDS);

  const [buyer1, sellerUser1, sellerUser2, admin1] = await Promise.all([
    prisma.userAccount.upsert({
      where: { email: 'comprador@amazonia.com' },
      update: {},
      create: {
        fullName: 'Carlos Pérez',
        nationalId: 'V-11111111',
        email: 'comprador@amazonia.com',
        passwordHash: password,
        username: 'carlospz',
        role: UserRole.BUYER,
        age: 30,
        nationality: 'Venezolano',
        phonePrimary: '+58 412 1000001',
        locationCity: 'Caracas',
        locationRegion: 'Distrito Capital',
        locationFormattedAddress: 'Av. Principal de Las Mercedes, Caracas',
      },
    }),
    prisma.userAccount.upsert({
      where: { email: 'vendedor1@amazonia.com' },
      update: {},
      create: {
        fullName: 'María González',
        nationalId: 'V-22222222',
        email: 'vendedor1@amazonia.com',
        passwordHash: password,
        username: 'mariagonz',
        role: UserRole.SELLER,
        age: 35,
        nationality: 'Venezolana',
        phonePrimary: '+58 414 2000002',
        locationCity: 'Caracas',
        locationRegion: 'Distrito Capital',
        locationFormattedAddress: 'Calle Sucre, Chacao, Caracas',
      },
    }),
    prisma.userAccount.upsert({
      where: { email: 'vendedor2@amazonia.com' },
      update: {},
      create: {
        fullName: 'José Rodríguez',
        nationalId: 'V-33333333',
        email: 'vendedor2@amazonia.com',
        passwordHash: password,
        username: 'joserod',
        role: UserRole.SELLER,
        age: 42,
        nationality: 'Venezolano',
        phonePrimary: '+58 416 3000003',
        locationCity: 'Valencia',
        locationRegion: 'Carabobo',
        locationFormattedAddress: 'Av. Bolívar Norte, Valencia',
      },
    }),
    prisma.userAccount.upsert({
      where: { email: 'admin@amazonia.com' },
      update: {},
      create: {
        fullName: 'Administrador Sistema',
        nationalId: 'V-00000000',
        email: 'admin@amazonia.com',
        passwordHash: password,
        username: 'admin',
        role: UserRole.ADMIN,
      },
    }),
  ]);

  // Inject GPS coords for users via raw PostGIS
  await Promise.all([
    prisma.$executeRaw`
      UPDATE user_account SET location_coords = ST_SetSRID(ST_MakePoint(-66.8792, 10.4985), 4326)
      WHERE id = ${buyer1.id}::uuid
    `,
    prisma.$executeRaw`
      UPDATE user_account SET location_coords = ST_SetSRID(ST_MakePoint(-66.8529, 10.4917), 4326)
      WHERE id = ${sellerUser1.id}::uuid
    `,
    prisma.$executeRaw`
      UPDATE user_account SET location_coords = ST_SetSRID(ST_MakePoint(-68.0069, 10.1617), 4326)
      WHERE id = ${sellerUser2.id}::uuid
    `,
  ]);

  // ──────────────────────────────────────────────
  // 3. SELLERS
  // ──────────────────────────────────────────────
  console.log('  → Sellers...');
  const [seller1, seller2] = await Promise.all([
    prisma.seller.upsert({
      where: { id: sellerUser1.id },
      update: {},
      create: {
        id: sellerUser1.id,
        tribeId: tribeTech.id,
        description: 'Tech specialist. Latest gadgets and electronics.',
      },
    }),
    prisma.seller.upsert({
      where: { id: sellerUser2.id },
      update: {},
      create: {
        id: sellerUser2.id,
        tribeId: tribeFashion.id,
        description: 'Fashion boutique. High quality clothing and accessories.',
      },
    }),
    // For seeding purposes, we'll reuse admin or buyer IDs as sellers if needed, 
    // but better to create more users or just leave it for now.
    // Actually, let's keep it to 2 sellers for now but correctly referenced.
  ]);

  // ──────────────────────────────────────────────
  // 4. PRODUCT CATEGORIES
  // ──────────────────────────────────────────────
  console.log('  → ProductCategories...');
  const [catPhones, catLaptops, catClothing, catAccessories, catFurniture, catFood] = await Promise.all([
    prisma.productCategory.upsert({ where: { id: 1 }, update: {}, create: { categoryName: 'Electronics', subcategoryName: 'Phones' } }),
    prisma.productCategory.upsert({ where: { id: 2 }, update: {}, create: { categoryName: 'Electronics', subcategoryName: 'Laptops' } }),
    prisma.productCategory.upsert({ where: { id: 3 }, update: {}, create: { categoryName: 'Fashion', subcategoryName: 'Clothing' } }),
    prisma.productCategory.upsert({ where: { id: 4 }, update: {}, create: { categoryName: 'Fashion', subcategoryName: 'Accessories' } }),
    prisma.productCategory.upsert({ where: { id: 5 }, update: {}, create: { categoryName: 'Home', subcategoryName: 'Furniture' } }),
    prisma.productCategory.upsert({ where: { id: 6 }, update: {}, create: { categoryName: 'Food', subcategoryName: 'Snacks' } }),
  ]);

  // ──────────────────────────────────────────────
  // 5. PRODUCTS
  // ──────────────────────────────────────────────
  console.log('  → Products...');

  const [prodSamsung, prodIphone, prodMacbook, prodNike, prodBolso] = await Promise.all([
    prisma.product.create({
      data: {
        sellerId: seller1.id,
        categoryId: catPhones.id,
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Pantalla 6.8", cámara 200MP, S-Pen incluido. Color: Negro Titanio.',
        price: 999.99,
        stockAvailable: 15,
        locationCity: 'Caracas',
        locationRegion: 'Distrito Capital',
        locationFormattedAddress: 'Calle Sucre, Chacao, Caracas',
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller1.id,
        categoryId: catPhones.id,
        name: 'iPhone 15 Pro Max',
        description: 'Chip A17 Pro, titanio, USB-C, 256GB. Garantía Apple 1 año.',
        price: 1199.99,
        stockAvailable: 8,
        locationCity: 'Caracas',
        locationRegion: 'Distrito Capital',
        locationFormattedAddress: 'Calle Sucre, Chacao, Caracas',
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller1.id,
        categoryId: catLaptops.id,
        name: 'MacBook Air M3',
        description: 'Chip M3, 16GB RAM, 512GB SSD, pantalla Liquid Retina 15".',
        price: 1499.00,
        stockAvailable: 5,
        locationCity: 'Caracas',
        locationRegion: 'Distrito Capital',
        locationFormattedAddress: 'Calle Sucre, Chacao, Caracas',
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller2.id,
        categoryId: catClothing.id,
        name: 'Sneakers Nike Air Max 270',
        description: 'Talla 42. Color blanco/negro. Originales importados de USA.',
        price: 159.99,
        stockAvailable: 30,
        locationCity: 'Valencia',
        locationRegion: 'Carabobo',
        locationFormattedAddress: 'Av. Bolívar Norte, Valencia',
      },
    }),

    prisma.product.create({
      data: {
        sellerId: seller1.id,
        categoryId: catPhones.id, // For simplicity we attach it to an existing category
        name: 'Casabe Artesanal',
        description: 'Casabe fresco y crujiente, elaborado tradicionalmente a base de yuca amarga.',
        price: 15.0,
        stockAvailable: 100,
        
        // General elaboration description
        elaborationText: 'El casabe se elabora a partir de la yuca amarga, que se pela, se ralla, se exprime para sacarle el yare (jugo tóxico) y luego se tuesta en un budare.',
        elaborationMediaUrls: [
          'https://iqkevgyeyoixwhmcptgq.supabase.co/storage/v1/object/public/amazonia-marketplace/casabe/casabe-DSC1560.jpg',
          'https://iqkevgyeyoixwhmcptgq.supabase.co/storage/v1/object/public/amazonia-marketplace/casabe/WhatsApp_Image_2026-06-09_at_12.03.51_PM.jpeg'
        ],

        // Step-by-step elaboration
        elaborationSteps: {
          create: [
            {
              stepNumber: 1,
              title: 'Recolección y pelado de la yuca',
              description: 'Se extrae la yuca de la tierra, se lava y se pela cuidadosamente.',
              mediaUrls: ['https://iqkevgyeyoixwhmcptgq.supabase.co/storage/v1/object/public/amazonia-marketplace/casabe/casabe-DSC1560.jpg']
            },
            {
              stepNumber: 2,
              title: 'Rallado',
              description: 'La yuca se ralla para formar una masa húmeda.',
              mediaUrls: ['https://iqkevgyeyoixwhmcptgq.supabase.co/storage/v1/object/public/amazonia-marketplace/casabe/WhatsApp_Image_2026-06-09_at_12.03.51_PM.jpeg']
            },
            {
              stepNumber: 3,
              title: 'Prensado en el sebucán',
              description: 'Se exprime la masa en el sebucán para extraer todo el líquido tóxico (yare).',
              mediaUrls: ['https://iqkevgyeyoixwhmcptgq.supabase.co/storage/v1/object/public/amazonia-marketplace/casabe/Secando_casabe.jpg']
            },
            {
              stepNumber: 4,
              title: 'Tostado en budare',
              description: 'La masa seca se extiende en forma circular sobre un budare caliente hasta que quede crujiente.',
              mediaUrls: ['https://iqkevgyeyoixwhmcptgq.supabase.co/storage/v1/object/public/amazonia-marketplace/casabe/WhatsApp_Video_2026-06-23_at_2.01.48_PM.mp4']
            }
          ]
        }
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller2.id,
        categoryId: catAccessories.id,
        name: 'Bolso Michael Kors Original',
        description: 'Bolso de cuero genuino, color café. Capacidad media.',
        price: 299.00,
        stockAvailable: 12,
        locationCity: 'Valencia',
        locationRegion: 'Carabobo',
        locationFormattedAddress: 'Av. Bolívar Norte, Valencia',
      },
    }),
  ]);

  // Inject GPS coords for products via raw PostGIS
  // Caracas (seller1 products): ~10.4917, -66.8529
  // Valencia (seller2 products): ~10.1617, -68.0069
  await Promise.all([
    prisma.$executeRaw`UPDATE product SET location_coords = ST_SetSRID(ST_MakePoint(-66.8529, 10.4917), 4326) WHERE id = ${prodSamsung.id}::uuid`,
    prisma.$executeRaw`UPDATE product SET location_coords = ST_SetSRID(ST_MakePoint(-66.8529, 10.4917), 4326) WHERE id = ${prodIphone.id}::uuid`,
    prisma.$executeRaw`UPDATE product SET location_coords = ST_SetSRID(ST_MakePoint(-66.8529, 10.4917), 4326) WHERE id = ${prodMacbook.id}::uuid`,
    prisma.$executeRaw`UPDATE product SET location_coords = ST_SetSRID(ST_MakePoint(-68.0069, 10.1617), 4326) WHERE id = ${prodNike.id}::uuid`,
    prisma.$executeRaw`UPDATE product SET location_coords = ST_SetSRID(ST_MakePoint(-68.0069, 10.1617), 4326) WHERE id = ${prodBolso.id}::uuid`,
  ]);

  // ──────────────────────────────────────────────
  // 6. PRODUCT RATINGS (+ auto-recalc averageRating)
  // ──────────────────────────────────────────────
  console.log('  → ProductRatings...');

  const ratingsData = [
    { productId: prodSamsung.id, userAccountId: buyer1.id, ratingValue: 5 },
    { productId: prodIphone.id, userAccountId: buyer1.id, ratingValue: 4 },
    { productId: prodNike.id, userAccountId: buyer1.id, ratingValue: 5 },
  ];

  for (const ratingData of ratingsData) {
    await prisma.productRating.upsert({
      where: { productId_userAccountId: { productId: ratingData.productId, userAccountId: ratingData.userAccountId } },
      update: { ratingValue: ratingData.ratingValue },
      create: ratingData,
    });

    // Recalculate averageRating on parent product
    const aggregate = await prisma.productRating.aggregate({
      where: { productId: ratingData.productId },
      _avg: { ratingValue: true },
    });
    await prisma.product.update({
      where: { id: ratingData.productId },
      data: { averageRating: aggregate._avg.ratingValue },
    });
  }

  // ──────────────────────────────────────────────
  // 7. PRODUCT ORDERS + STATUS HISTORY + MONGO SHIPMENTS
  // ──────────────────────────────────────────────
  console.log('  → ProductOrders and Mongo Shipments...');

  if (!process.env.MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI no está definido. Los eventos de envío de Mongo no se insertarán.');
  } else {
    console.log('🔌 Conectando a MongoDB para shipments...');
    await mongoose.connect(process.env.MONGODB_URI);
    await ShipmentEventModel.deleteMany({});
  }

  const trackingNumber1 = `TRK-${crypto.randomUUID().substring(0,8).toUpperCase()}`;
  const trackingNumber2 = `TRK-${crypto.randomUUID().substring(0,8).toUpperCase()}`;

  const order1 = await prisma.productOrder.create({
    data: {
      productId: prodSamsung.id,
      buyerId: buyer1.id,
      quantity: 1,
      totalAmount: 999.99,
      currentStatus: 'DELIVERED',
      sellerRatingValue: 5,
      orderNotes: 'Entrega urgente, producto en perfecto estado.',
      trackingNumber: trackingNumber1,
    },
  });

  await prisma.orderStatusHistory.createMany({
    data: [
      { orderId: order1.id, changedByUserId: buyer1.id, previousStatus: null, newStatus: 'PENDING', statusNote: 'Orden creada' },
      { orderId: order1.id, changedByUserId: sellerUser1.id, previousStatus: 'PENDING', newStatus: 'PAID', statusNote: 'Pago confirmado' },
      { orderId: order1.id, changedByUserId: sellerUser1.id, previousStatus: 'PAID', newStatus: 'SHIPPED', statusNote: 'Paquete enviado via MRW' },
      { orderId: order1.id, changedByUserId: buyer1.id, previousStatus: 'SHIPPED', newStatus: 'DELIVERED', statusNote: 'Recibido en perfectas condiciones' },
    ],
  });

  // Update seller rating based on the delivered order
  const sellerAggregate = await prisma.productOrder.aggregate({
    where: { product: { sellerId: seller1.id }, sellerRatingValue: { not: null } },
    _avg: { sellerRatingValue: true },
  });
  if (sellerAggregate._avg.sellerRatingValue !== null) {
    await prisma.seller.update({
      where: { id: seller1.id },
      data: { rating: Math.round(sellerAggregate._avg.sellerRatingValue) },
    });
  }

  const order2 = await prisma.productOrder.create({
    data: {
      productId: prodNike.id,
      buyerId: buyer1.id,
      quantity: 2,
      totalAmount: 319.98,
      currentStatus: 'PAID',
      orderNotes: 'Talla 42, color blanco.',
      trackingNumber: trackingNumber2,
    },
  });

  await prisma.orderStatusHistory.createMany({
    data: [
      { orderId: order2.id, changedByUserId: buyer1.id, previousStatus: null, newStatus: 'PENDING', statusNote: 'Orden creada' },
      { orderId: order2.id, changedByUserId: sellerUser2.id, previousStatus: 'PENDING', newStatus: 'PAID', statusNote: 'Transferencia recibida' },
    ],
  });

  if (process.env.MONGODB_URI) {
    const now = new Date();
    const generateEvents = (trackingNumber: string, containerId: string) => {
      const events: any[] = [];
      for (let i = 0; i < 25; i++) {
        const eventDate = new Date(now.getTime() - (25 - i) * 60 * 60 * 1000); 
        events.push({
          event_id: crypto.randomUUID(),
          event_type: 'shipment_telemetry',
          recorded_at: eventDate,
          ingested_at: now,
          metadata: { tracking_number: trackingNumber, container_id: containerId },
          location: { type: 'Point', coordinates: [-66.8792 + (i * 0.01), 10.4985 + (i * 0.01)] },
          business_context: { status: i === 24 ? 'DELIVERED' : i === 0 ? 'CREATED' : 'IN_TRANSIT', scan_type: 'AUTOMATED' },
          telemetry: { temperature_celsius: Number((20 + (Math.random() * 5)).toFixed(2)), shock_g_force: Number((Math.random() * 2).toFixed(2)) }
        });
      }
      return events;
    };
    await ShipmentEventModel.insertMany([...generateEvents(trackingNumber1, 'CONT-1'), ...generateEvents(trackingNumber2, 'CONT-2')]);
    console.log(`🎉 ¡Eventos de Mongo insertados exitosamente para los trackings: ${trackingNumber1}, ${trackingNumber2}`);
  }

  // ──────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────
  console.log('\n✅ Seed completado exitosamente!\n');
  console.log('  Credenciales de prueba (todos usan la misma contraseña):');
  console.log('  🔑 Password: Password123!');
  console.log(`  🛒 Comprador : comprador@amazonia.com`);
  console.log(`  🏪 Vendedor 1: vendedor1@amazonia.com  (Electrónica · Caracas)`);
  console.log(`  🏪 Vendedor 2: vendedor2@amazonia.com  (Moda · Valencia)`);
  console.log(`  ⚙️ Admin     : admin@amazonia.com`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (process.env.MONGODB_URI) await mongoose.disconnect();
  });
