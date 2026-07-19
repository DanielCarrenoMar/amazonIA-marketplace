const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { ShipmentSensor } = require('../src/shipment-sensor');

console.log("🚀 Iniciando prueba de sensor de envío (Standalone - Todos los perfiles)...");

const profiles = ['GPS_BASIC', 'COLD_CHAIN', 'IMPACT_GUARD', 'AMBIENT_MONITOR', 'FULL_TELEMETRY'];
const sensors = profiles.map((profile, index) => {
  return new ShipmentSensor({
    sensorId: `TEST-${profile}`,
    origin: { lat: 40.4168 + index * 0.01, lng: -3.7038 }, // Ligeramente desplazados
    destination: { lat: 41.3851 + index * 0.01, lng: 2.1734 }
  });
});

sensors.forEach(sensor => sensor.start());

console.log(`⏳ ${sensors.length} sensores generarán y enviarán datos de telemetría cada 5 segundos.`);
console.log("Presiona Ctrl+C para detener la prueba, o espera 30 segundos para que se detenga automáticamente.\n");

setTimeout(async () => {
  console.log("\n🛑 Deteniendo sensores de prueba...");
  for (const sensor of sensors) {
    await sensor.stop();
  }
  console.log("✅ Prueba finalizada.");
  process.exit(0);
}, 30000);
