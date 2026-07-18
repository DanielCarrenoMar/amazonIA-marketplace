const { startSimulation } = require('./core/runner');
const { ChaosMqttClient } = require('./core/mqtt-client');
require('dotenv').config();

const username = process.env.HIVEMQ_USERNAME || "clima01";
const digits = username.replace(/\D/g, "") || "1";
const SENSOR_ID = `CLM-${digits}`;

const WEATHER_STATIONS = [
  { lat: -3.119, lng: -60.0217, name: "Estación Manaos" },
  { lat: -2.4384, lng: -54.7308, name: "Estación Santarém" },
  { lat: -1.4558, lng: -48.5044, name: "Estación Belém" },
  { lat: -3.4653, lng: -62.2159, name: "Estación Alenquer" },
  { lat: -0.0356, lng: -51.0566, name: "Estación Macapá" }
];

const station = WEATHER_STATIONS[(Number.parseInt(digits, 10) - 1) % WEATHER_STATIONS.length] || WEATHER_STATIONS[0];
const chaosClient = new ChaosMqttClient("amazonia/iot/climate");

let publishInterval = null;

function randomBetween(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function generateClimatePayload() {
  const lat = station.lat + randomBetween(-0.001, 0.001);
  const lng = station.lng + randomBetween(-0.001, 0.001);
  
  // Esquema híbrido: claves principales en raíz para índices rápidos
  const payload = {
    sensor_id: SENSOR_ID,
    recorded_at: new Date().toISOString(),
    location: {
      type: "Point",
      coordinates: [parseFloat(lng.toFixed(6)), parseFloat(lat.toFixed(6))]
    },
    metrics: {
      temperature_celsius: randomBetween(24, 38),
      humidity_percent: randomBetween(60, 99),
      pressure_hpa: randomBetween(1005, 1020),
      wind_speed_kmh: randomBetween(0, 25),
      uv_index: randomBetween(1, 12),
      rainfall_mm: Math.random() < 0.4 ? randomBetween(0.1, 15) : 0,
    }
  };

  // Caos de Formato (Corrupción de datos)
  const corruptProb = parseFloat(process.env.CHAOS_CORRUPT_DATA_PROBABILITY || "0.0");
  if (corruptProb > 0 && Math.random() < corruptProb) {
    console.log("🐛 [CAOS] Inyectando datos corruptos al JSON...");
    // Mutaciones aleatorias a los tipos de datos
    payload.metrics.temperature_celsius = "muy caliente"; 
    payload.metrics.unplanned_field = "esto no estaba en el esquema";
    delete payload.metrics.humidity_percent; // Omitir datos esperados
  }

  return payload;
}

function start() {
  chaosClient.connect(username);
  
  publishInterval = setInterval(() => {
    const payload = generateClimatePayload();
    chaosClient.publish(payload);
    
    // Solo mostramos log si no hay falla de red (para simular el silencio)
    if (!chaosClient.isNetworkDown) {
      console.log(`📡 [CLIMA] ${SENSOR_ID} en ${station.name} | Temp: ${payload.metrics.temperature_celsius}`);
    }
  }, 5000);
}

async function stop() {
  if (publishInterval) clearInterval(publishInterval);
  await chaosClient.disconnect();
}

startSimulation(SENSOR_ID, start, stop);
