const mqtt = require('mqtt');
require('dotenv').config();

const requiredEnvVars = ['HIVEMQ_HOST', 'HIVEMQ_PORT', 'HIVEMQ_USERNAME', 'HIVEMQ_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Faltan variables de entorno: ${missingEnvVars.join(', ')}`);
  console.error('   Revisa el archivo .env y completa los datos reales de HiveMQ Cloud.');
  process.exit(1);
}

const hivemqHost = process.env.HIVEMQ_HOST.trim();
const hivemqPort = Number.parseInt(process.env.HIVEMQ_PORT, 10);

if (!Number.isInteger(hivemqPort) || hivemqPort <= 0) {
  console.error(`❌ HIVEMQ_PORT inválido: ${process.env.HIVEMQ_PORT}`);
  process.exit(1);
}

if (hivemqHost.includes('your-cluster-id') || process.env.HIVEMQ_USERNAME === 'sensor01' || process.env.HIVEMQ_PASSWORD === 'changeme') {
  console.warn('⚠️  Detecté valores de ejemplo en .env. Sustitúyelos por credenciales reales de HiveMQ Cloud.');
}

// ── Configuración de conexión ──────────────────────────
const client = mqtt.connect({
  host: hivemqHost,
  port: hivemqPort,
  protocol: 'mqtts',          // TLS obligatorio en HiveMQ Cloud
  username: process.env.HIVEMQ_USERNAME,
  password: process.env.HIVEMQ_PASSWORD,
  connectTimeout: 15000,
  reconnectPeriod: 5000,
});

console.log(`🔗 Conectando a HiveMQ Cloud en ${hivemqHost}:${hivemqPort}...`);

// ── Datos del pedido simulado (Sensor de Clima) ────────
const ORDER_ID = 'CLIMA-001';


// Posición simulada: punto GPS fijo del Amazonas (con leve variación en cada lectura)
const POSITION = { lat: -3.1190, lng: -60.0217, name: 'Manaos - Estación Clima', status: 'IN_TRANSIT' };


let currentCheckpoint = 0;

// ── Helpers ──
function randomBetween(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function simulateShock() {
  // 10% de probabilidad de un golpe significativo
  /*return Math.random() < 0.10
    ? randomBetween(2.0, 5.0)   // golpe fuerte
    : randomBetween(0.1, 0.8);  // vibración normal*/
  return null;
}

function getTimestamp() {
  return new Date().toISOString();
}

// Mapear el estado del prototipo a los estados válidos de ShipmentStatus en la DB/Ingestor
function mapStatus(status) {
  switch (status) {
    case 'ORIGIN':
      return 'pending_pickup';
    case 'NEAR_DESTINATION':
      return 'out_for_delivery';
    case 'DELIVERED':
      return 'delivered';
    case 'IN_TRANSIT':
    case 'CHECKPOINT':
    default:
      return 'in_transit';
  }
}

// ── Publicar evento consolidado compatible ─────────────────────────
function publishTelemetry() {

  // Pequeña variación de coordenadas GPS alrededor de la posición para simular ruido del GPS
  const lat = POSITION.lat + randomBetween(-0.0005, 0.0005);
  const lng = POSITION.lng + randomBetween(-0.0005, 0.0005);

  const payload = {
    event_type: 'shipment_telemetry',
    recorded_at: getTimestamp(),
    metadata: {
      tracking_number: ORDER_ID,
      container_id: 'DEV-AMAZONIA-01',
    },
    location: {
      type: 'Point',
      coordinates: [parseFloat(lng.toFixed(6)), parseFloat(lat.toFixed(6))] // [longitude, latitude] GeoJSON
    },
    business_context: {
      status: mapStatus(POSITION.status),
      scan_type: 'gps'
    },
    telemetry: {
      temperature_celsius: randomBetween(24, 38), // Amazonas
      shock_g_force: simulateShock()
    }
  };

  const topic = 'amazonia/iot/shipment';
  client.publish(topic, JSON.stringify(payload), { qos: 1 });

  console.log(`\n📡 [SENSOR CLIMA] Publicado evento en tópico '${topic}':`);
  console.log(`   Lugar: ${POSITION.name} | Estado: ${payload.business_context.status}`);
  console.log(`   GPS: [${payload.location.coordinates.join(', ')}]`);
  console.log(`   Temperatura: ${payload.telemetry.temperature_celsius}°C | Shock: ${payload.telemetry.shock_g_force}G`);
}

// ── Eventos de conexión ────────────────────────────────
client.on('connect', () => {
  console.log('✅ Sensor de clima conectado exitosamente a HiveMQ Cloud');
  console.log(`📦 Simulando pedido consolidado clima: ${ORDER_ID}`);
  console.log('─'.repeat(55));

  // Publicar datos cada 5 segundos de forma consolidada y compatible
  setInterval(publishTelemetry, 5000);

  // Publicar el primer dato inmediatamente
  publishTelemetry();
});

client.on('error', (error) => {
  console.error('❌ Error de conexión:', error.message);
  if (error.message.includes('connack timeout')) {
    console.error('   Casi siempre significa que el host o el puerto no corresponden al broker MQTT TLS, o que el broker no está respondiendo.');
    console.error('   Verifica HIVEMQ_HOST, HIVEMQ_PORT y que el cluster esté activo en HiveMQ Cloud.');
  }
});

client.on('reconnect', () => {
  console.log('🔄 Reintentando conexión MQTT...');
});

client.on('offline', () => {
  console.log('📴 Cliente MQTT fuera de línea temporalmente');
});

client.on('close', () => {
  console.log('🔌 Conexión cerrada');
});

// ── systemd envía SIGTERM ──────────
function shutdown(signal) {
  console.log(`\n🛑 Señal ${signal} recibida. Cerrando conexión MQTT…`);
  client.end(false, {}, () => {
    console.log('👋 Desconectado limpiamente. Adiós.');
    process.exit(0);
  });

  // Forzar salida si el broker no responde en 3 s
  setTimeout(() => {
    console.warn('⚠️  Timeout esperando desconexión. Forzando salida.');
    process.exit(1);
  }, 3000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));