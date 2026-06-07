import 'dotenv/config'; // Load .env
import { Redis } from '@upstash/redis';
import { STREAM_TOPICS } from 'messaging';
import { IClimateEvent, IoTEventType, SensorType } from 'event-types';
import { randomUUID } from 'crypto';

async function main() {
  console.log('Inicializando Redis...');
  const redis = new Redis({
    url: process.env.REDIS_URL || '',
    token: process.env.REDIS_TOKEN || '',
  });

  const testEvent: IClimateEvent = {
    event_id: randomUUID(),
    event_type: IoTEventType.ENVIRONMENT_READING,
    recorded_at: new Date().toISOString(),
    ingested_at: new Date().toISOString(),
    metadata: {
      sensor_id: 'test-sensor-001',
      facility_id: 'test-facility-001',
      sensor_type: SensorType.FIXED_HVAC,
    },
    location: {
      type: 'Point',
      coordinates: [-73.935242, 40.730610],
    },
    telemetry: {
      temperature_celsius: 24.5,
      humidity_percent: 55,
    },
  };

  console.log(`Enviando evento de prueba (ID: ${testEvent.event_id})...`);
  
  try {
    const fields = { data: JSON.stringify(testEvent) };
    await redis.xadd(STREAM_TOPICS.CLIMATE_EVENTS, '*', fields);
    console.log('✅ Evento enviado correctamente a Redis Streams.');
    console.log('Por favor verifica los logs de tu telemetry-worker para confirmar que se procesó e insertó en MongoDB.');
  } catch (error) {
    console.error('❌ Error al enviar evento a Redis:', error);
  }
}

main().catch(console.error);
