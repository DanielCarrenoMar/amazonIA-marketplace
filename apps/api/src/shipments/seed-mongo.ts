import mongoose from 'mongoose';
import { ShipmentEventSchema } from 'database';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno desde apps/api/.env
dotenv.config({ path: resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definido en .env');
  process.exit(1);
}

// El nombre del modelo debe coincidir con el nombre de la colección en NestJS 
// Por defecto NestJS usa el nombre de la clase + una 's' al final, pero si en tu
// servicio lo inyectas como ShipmentEventDocument.name, mongoose usa "shipmenteventdocuments" o el que defina.
// Para estar seguros usaremos el nombre exacto de la clase tal como lo inyecta NestJS.
const ShipmentEventModel = mongoose.models.ShipmentEventDocument || mongoose.model('ShipmentEventDocument', ShipmentEventSchema);

async function seed() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI as string);
    console.log('✅ Conectado exitosamente.');

    // Opcional: borrar datos anteriores de prueba
    console.log('🗑️ Limpiando datos de telemetría anteriores...');
    await ShipmentEventModel.deleteMany({});

    const trackingNumber = 'TRK-TEST-12345';
    const containerId = 'CONT-987';
    
    console.log(`🌱 Insertando datos semilla para tracking number: ${trackingNumber}`);
    
    const events: any[] = [];
    const now = new Date();
    
    // Creamos 25 eventos para poder probar la paginación (ej. 3 páginas de a 10)
    for (let i = 0; i < 25; i++) {
      // Separamos los eventos por 1 hora de diferencia
      const eventDate = new Date(now.getTime() - (25 - i) * 60 * 60 * 1000); 
      
      events.push({
        event_id: crypto.randomUUID(),
        event_type: 'shipment_telemetry',
        recorded_at: eventDate,
        ingested_at: now,
        metadata: {
          tracking_number: trackingNumber,
          container_id: containerId,
        },
        location: {
          type: 'Point',
          // Movimiento simulado: (longitud, latitud)
          coordinates: [-74.006 + (i * 0.01), 40.7128 + (i * 0.01)], 
        },
        business_context: {
          status: i === 24 ? 'DELIVERED' : i === 0 ? 'CREATED' : 'IN_TRANSIT',
          scan_type: 'AUTOMATED',
        },
        telemetry: {
          temperature_celsius: Number((20 + (Math.random() * 5)).toFixed(2)),
          shock_g_force: Number((Math.random() * 2).toFixed(2)),
        }
      });
    }

    await ShipmentEventModel.insertMany(events);
    console.log(`🎉 ¡Se insertaron ${events.length} eventos exitosamente!`);
    console.log(`Para probar, consulta el endpoint o el servicio con trackingNumber: ${trackingNumber}`);

  } catch (error) {
    console.error('❌ Error ejecutando seeder:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB.');
  }
}

seed();
