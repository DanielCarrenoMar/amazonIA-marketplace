const { startSimulation } = require('./core/runner');
const { ChaosMqttClient } = require('./core/mqtt-client');
require('dotenv').config();

const username = process.env.HIVEMQ_USERNAME || "sensor02";
const digits = username.replace(/\D/g, "") || "2";
const SENSOR_ID = `ORD-${digits.padStart(3, "0")}`;
const TRACKING_NUMBER = `ORD-00${digits}`;
const CONTAINER_ID = `DEV-AMAZONIA-${digits.padStart(3, "0")}`;

// Rutas estáticas para la simulación autónoma (Manaos -> Belém)
const origin = { lat: -3.119, lng: -60.0217 };
const destination = { lat: -1.4558, lng: -48.5044 };

let routeCheckpoints = [];
let currentCheckpoint = 0;
let publishInterval = null;
const client = new ChaosMqttClient("amazonia/iot/shipment");

function generateRoute(orig, dest) {
  const steps = 5;
  const checkpoints = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = orig.lat + (dest.lat - orig.lat) * ratio;
    const lng = orig.lng + (dest.lng - orig.lng) * ratio;

    let status = "in_transit";
    if (i === 0) status = "pending_pickup";
    else if (i === steps) status = "delivered";
    else if (i === steps - 1) status = "out_for_delivery";

    checkpoints.push({
      lat,
      lng,
      name: i === 0 ? "Origen" : i === steps ? "Destino Final" : `Punto de Control ${i}`,
      status
    });
  }
  return checkpoints;
}

function randomBetween(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function simulateShock() {
  return Math.random() < 0.1 ? randomBetween(2.0, 5.0) : randomBetween(0.1, 0.8);
}

function publishTelemetry() {
  const checkpoint = routeCheckpoints[currentCheckpoint];
  const lat = checkpoint.lat + randomBetween(-0.005, 0.005);
  const lng = checkpoint.lng + randomBetween(-0.005, 0.005);

  const payload = {
    event_type: "shipment_telemetry",
    recorded_at: new Date().toISOString(),
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lng.toFixed(6)),
    metadata: {
      tracking_number: TRACKING_NUMBER,
      container_id: CONTAINER_ID,
      sensor_id: SENSOR_ID,
    },
    business_context: {
      status: checkpoint.status,
      scan_type: "gps",
    },
    telemetry: {
      temperature_celsius: randomBetween(24, 38),
      shock_g_force: simulateShock(),
    }
  };

  client.publish(payload);

  if (!client.isNetworkDown) {
    console.log(`📦 [ENVÍO] ${SENSOR_ID} en ${checkpoint.name} | Estado: ${checkpoint.status} | GPS: [${payload.latitude}, ${payload.longitude}]`);
  }

  // Avanzar checkpoint autónomamente
  if (currentCheckpoint < routeCheckpoints.length - 1) {
    currentCheckpoint++;
  } else {
    // Si llegó, esperar un poco o reiniciar
    console.log("🔄 Ruta completada. Reiniciando trayecto...");
    currentCheckpoint = 0;
  }
}

function start() {
  routeCheckpoints = generateRoute(origin, destination);
  client.connect(username);
  
  console.log(`🚀 [ENVÍO] Sensor ${SENSOR_ID} iniciando ruta autónoma (Origen -> Destino)`);
  
  publishInterval = setInterval(publishTelemetry, 5000);
}

async function stop() {
  if (publishInterval) clearInterval(publishInterval);
  await client.disconnect();
}

async function runShipmentSimulation(durationSec) {
  return startSimulation(SENSOR_ID, start, stop, durationSec);
}

// Auto-ejecución si se lanza por CLI
if (require.main === module) {
  runShipmentSimulation();
}

module.exports = { runShipmentSimulation };
