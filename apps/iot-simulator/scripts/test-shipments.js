const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { ShipmentSensor } = require('../src/shipment-sensor');

console.log("🚀 Iniciando prueba de sensor de envío (Standalone - Todos los perfiles)...");

const profilesStr = process.env.TEST_SENSOR_PROFILES || 'GPS_BASIC,COLD_CHAIN,IMPACT_GUARD,AMBIENT_MONITOR,FULL_TELEMETRY';
const profiles = profilesStr.split(',').map(s => s.trim());
const routeOriginLat = parseFloat(process.env.ROUTE_ORIGIN_LAT || 40.4168);
const routeOriginLng = parseFloat(process.env.ROUTE_ORIGIN_LNG || -3.7038);
const routeDestLat = parseFloat(process.env.ROUTE_DEST_LAT || 41.3851);
const routeDestLng = parseFloat(process.env.ROUTE_DEST_LNG || 2.1734);

const sensors = profiles.map((profile, index) => {
  return new ShipmentSensor({
    sensorId: `TEST-${profile}`,
    origin: { lat: routeOriginLat + index * 0.01, lng: routeOriginLng },
    destination: { lat: routeDestLat + index * 0.01, lng: routeDestLng }
  });
});

sensors.forEach(sensor => sensor.start());

const interval = parseInt(process.env.TELEMETRY_INTERVAL_MS || 5000, 10);
console.log(`⏳ ${sensors.length} sensores generarán y enviarán datos de telemetría cada ${interval / 1000} segundos.`);
const duration = parseInt(process.env.TEST_DURATION_SECONDS || 30, 10);
console.log(`Presiona Ctrl+C para detener la prueba, o espera ${duration} segundos para que se detenga automáticamente.\n`);

setTimeout(async () => {
  console.log("\n🛑 Deteniendo sensores de prueba...");
  for (const sensor of sensors) {
    await sensor.stop();
  }
  console.log("✅ Prueba finalizada.");
  process.exit(0);
}, duration * 1000);
