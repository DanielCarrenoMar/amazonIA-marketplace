const mqtt = require("mqtt");
require("dotenv").config();

const requiredEnvVars = [
  "HIVEMQ_HOST",
  "HIVEMQ_PORT",
  "HIVEMQ_USERNAME",
  "HIVEMQ_PASSWORD",
];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Faltan variables de entorno: ${missingEnvVars.join(", ")}`);
  console.error(
    "   Revisa el archivo .env y completa los datos reales de HiveMQ Cloud.",
  );
  process.exit(1);
}

const hivemqHost = process.env.HIVEMQ_HOST.trim();
const hivemqPort = Number.parseInt(process.env.HIVEMQ_PORT, 10);

if (!Number.isInteger(hivemqPort) || hivemqPort <= 0) {
  console.error(`❌ HIVEMQ_PORT inválido: ${process.env.HIVEMQ_PORT}`);
  process.exit(1);
}

if (
  hivemqHost.includes("your-cluster-id") ||
  process.env.HIVEMQ_USERNAME === "your-username" ||
  process.env.HIVEMQ_PASSWORD === "your-password"
) {
  console.warn(
    "⚠️  Detecté valores de ejemplo en .env. Sustitúyelos por credenciales reales de HiveMQ Cloud.",
  );
}

// ── Configuración de conexión ──────────────────────────
const client = mqtt.connect({
  host: hivemqHost,
  port: hivemqPort,
  protocol: "mqtts", // TLS obligatorio en HiveMQ Cloud
  username: process.env.HIVEMQ_USERNAME,
  password: process.env.HIVEMQ_PASSWORD,
  connectTimeout: 15000,
  reconnectPeriod: 5000,
});

console.log(`🔗 Conectando a HiveMQ Cloud en ${hivemqHost}:${hivemqPort}...`);

// ── Datos del pedido simulado ──────────────────────────
// Determinar tipo de sensor basado en el usuario de HiveMQ
const username = process.env.HIVEMQ_USERNAME || "";
let prefix = "ORD";
let sensorNumber = "1";

if (username.toLowerCase().includes("clima")) {
  prefix = "CLM";
  const digits = username.replace(/\D/g, "");
  sensorNumber = digits ? parseInt(digits, 10).toString() : "1";
} else if (username.toLowerCase().includes("sensor")) {
  prefix = "ORD";
  const digits = username.replace(/\D/g, "");
  sensorNumber = digits ? parseInt(digits, 10).toString() : "1";
}

let trackingNumber = prefix === "CLM" ? `CLM-${sensorNumber}` : null;
const SENSOR_ID =
  prefix === "CLM"
    ? `CLM-${sensorNumber}`
    : `ORD-${sensorNumber.padStart(3, "0")}`;

const CONTAINER_ID =
  prefix === "CLM"
    ? `DEV-CLIMA-${sensorNumber.padStart(3, "0")}`
    : `DEV-AMAZONIA-${sensorNumber.padStart(3, "0")}`;



// Estaciones meteorológicas fijas en la cuenca del Amazonas
const WEATHER_STATIONS = [
  { lat: -3.119, lng: -60.0217, name: "Estación Manaos" },
  { lat: -2.4384, lng: -54.7308, name: "Estación Santarém" },
  { lat: -1.4558, lng: -48.5044, name: "Estación Belém" },
  { lat: -3.4653, lng: -62.2159, name: "Estación Alenquer" },
  { lat: -0.0356, lng: -51.0566, name: "Estación Macapá" },
];

let currentCheckpoint = 0;
let isAssigned = false;
let routeCheckpoints = [];

// Seleccionar estación fija para sensores de clima (basado en número de sensor)
const weatherStationIndex =
  prefix === "CLM"
    ? (Number.parseInt(sensorNumber, 10) - 1) % WEATHER_STATIONS.length
    : 0;

// ── Helpers ──
function generateRoute(origin, destination) {
  const steps = 5;
  const checkpoints = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = origin.lat + (destination.lat - origin.lat) * ratio;
    const lng = origin.lng + (destination.lng - origin.lng) * ratio;

    let status = "IN_TRANSIT";
    if (i === 0) status = "ORIGIN";
    else if (i === steps) status = "DELIVERED";
    else if (i === steps - 1) status = "NEAR_DESTINATION";
    else if (i === Math.floor(steps / 2)) status = "CHECKPOINT";

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
  // 10% de probabilidad de un golpe significativo
  return Math.random() < 0.1
    ? randomBetween(2.0, 5.0) // golpe fuerte
    : randomBetween(0.1, 0.8); // vibración normal
}

function getTimestamp() {
  return new Date().toISOString();
}

// Mapear el estado del prototipo a los estados válidos de ShipmentStatus en la DB/Ingestor
function mapStatus(status) {
  switch (status) {
    case "ORIGIN":
      return "pending_pickup";
    case "NEAR_DESTINATION":
      return "out_for_delivery";
    case "DELIVERED":
      return "delivered";
    case "IN_TRANSIT":
    case "CHECKPOINT":
    default:
      return "in_transit";
  }
}

// ── Publicar evento consolidado compatible ─────────────────────────
function publishTelemetry() {
  if (prefix !== "CLM" && !isAssigned) {
    console.log(`⏳ [SENSOR] ${CONTAINER_ID} en espera de asignación de paquete y ruta...`);
    return;
  }

  let lat, lng, locationName;

  if (prefix === "CLM") {
    // Sensor de clima: estación fija con variación GPS mínima
    const station = WEATHER_STATIONS[weatherStationIndex];
    lat = station.lat + randomBetween(-0.001, 0.001);
    lng = station.lng + randomBetween(-0.001, 0.001);
    locationName = station.name;
  } else {
    // Sensor de paquete: avanza por la ruta
    const checkpoint = routeCheckpoints[currentCheckpoint];
    lat = checkpoint.lat + randomBetween(-0.005, 0.005);
    lng = checkpoint.lng + randomBetween(-0.005, 0.005);
    locationName = checkpoint.name;
  }

  const payload = {
    event_type: prefix === "CLM" ? "environment_reading" : "shipment_telemetry",
    recorded_at: getTimestamp(),
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lng.toFixed(6)),
  };

  if (prefix === "CLM") {
    // Contexto de estación meteorológica (metadata DTO compatible)
    payload.metadata = {
      sensor_id: trackingNumber,
      facility_id: "FAC-AMAZONAS-01",
      sensor_type: "fixed_hvac"
    };
    payload.telemetry = {
      temperature_celsius: randomBetween(24, 38),
      humidity_percent: randomBetween(60, 99),
      pressure_hpa: randomBetween(1005, 1020),
      wind_speed_kmh: randomBetween(0, 25),
      uv_index: randomBetween(1, 12),
      rainfall_mm: Math.random() < 0.4 ? randomBetween(0.1, 15) : 0,
    };
  } else {
    // Contexto logístico (metadata y business_context)
    payload.metadata = {
      tracking_number: trackingNumber,
      container_id: CONTAINER_ID,
      sensor_id: SENSOR_ID,
    };
    const checkpoint = routeCheckpoints[currentCheckpoint];
    payload.business_context = {
      status: mapStatus(checkpoint.status),
      scan_type: "gps",
    };
    payload.telemetry = {
      temperature_celsius: randomBetween(24, 38),
      shock_g_force: simulateShock(),
    };
  }

  const topic =
    prefix === "CLM" ? "amazonia/iot/climate" : "amazonia/iot/shipment";
  client.publish(topic, JSON.stringify(payload), { qos: 1 });

  console.log(`\n📡 [SENSOR] Publicado evento en tópico '${topic}':`);
  console.log(
    `   Lugar: ${locationName} | Tipo: ${prefix === "CLM" ? "Clima" : "Paquete"}`,
  );
  console.log(`   GPS: [${payload.latitude}, ${payload.longitude}]`);

  if (prefix === "CLM") {
    console.log(
      `   Temp: ${payload.telemetry.temperature_celsius}°C | Humedad: ${payload.telemetry.humidity_percent}% | Presión: ${payload.telemetry.pressure_hpa} hPa`,
    );
  } else {
    console.log(
      `   Temp: ${payload.telemetry.temperature_celsius}°C | Shock: ${payload.telemetry.shock_g_force}G`,
    );
  }

  // Avanzar checkpoint solo para sensores de paquete
  if (prefix !== "CLM") {
    if (isAssigned) {
      if (currentCheckpoint < routeCheckpoints.length - 1) {
        currentCheckpoint++;
      } else {
        console.log("🔄 Ruta completada. Reiniciando simulación del trayecto...");
        currentCheckpoint = 0;
      }
    }
  }
}

// ── Eventos de conexión ────────────────────────────────
client.on("connect", () => {
  console.log(`✅ Sensor conectado exitosamente a HiveMQ Cloud`);
  console.log(
    `📦 Simulando dispositivo: ${CONTAINER_ID} (Tipo: ${prefix === "CLM" ? "Clima" : "Paquete"})`,
  );

  if (prefix !== "CLM") {
    const controlTopic = `amazonia/iot/control/${SENSOR_ID}`;
    client.subscribe(controlTopic, { qos: 1 }, (err) => {
      if (err) {
        console.error(`❌ Error al suscribirse al tópico de control: ${err.message}`);
      } else {
        console.log(`📥 Suscrito a tópico de control: ${controlTopic}`);
      }
    });
  }

  console.log("─".repeat(55));

  // Publicar datos cada 30 segundos de forma consolidada y compatible (ahorro de cuota Upstash)
  setInterval(publishTelemetry, 30000);

  // Publicar el primer dato inmediatamente
  publishTelemetry();
});

client.on("message", (topic, message) => {
  if (topic === `amazonia/iot/control/${SENSOR_ID}`) {
    try {
      const data = JSON.parse(message.toString());
      if (data.action === "START_TRANSIT") {
        if (data.trackingNumber && data.origin && data.destination) {
          trackingNumber = data.trackingNumber;
          routeCheckpoints = generateRoute(data.origin, data.destination);
          currentCheckpoint = 0;
          isAssigned = true;
          
          console.log(`\n🚀 [SENSOR] ${CONTAINER_ID} Activado!`);
          console.log(`📦 Asignado al paquete: ${trackingNumber}`);
          console.log(`📍 Ruta generada con ${routeCheckpoints.length} puntos de control desde origen a destino.`);
          
          publishTelemetry();
        } else {
          console.warn("⚠️  Mensaje START_TRANSIT incompleto. Faltan datos de tracking, origin o destination.");
        }
      }
    } catch (err) {
      console.error("❌ Error decodificando mensaje de control:", err.message);
    }
  }
});

client.on("error", (error) => {
  console.error("❌ Error de conexión:", error.message);
  if (error.message.includes("connack timeout")) {
    console.error(
      "   Casi siempre significa que el host o el puerto no corresponden al broker MQTT TLS, o que el broker no está respondiendo.",
    );
    console.error(
      "   Verifica HIVEMQ_HOST, HIVEMQ_PORT y que el cluster esté activo en HiveMQ Cloud.",
    );
  }
});

client.on("reconnect", () => {
  console.log("🔄 Reintentando conexión MQTT...");
});

client.on("offline", () => {
  console.log("📴 Cliente MQTT fuera de línea temporalmente");
});

client.on("close", () => {
  console.log("🔌 Conexión cerrada");
});

// ── systemd envía SIGTERM ──────────
function shutdown(signal) {
  console.log(`\n🛑 Señal ${signal} recibida. Cerrando conexión MQTT…`);
  client.end(false, {}, () => {
    console.log("👋 Desconectado limpiamente. Adiós.");
    process.exit(0);
  });

  // Forzar salida si el broker no responde en 3 s
  setTimeout(() => {
    console.warn("⚠️  Timeout esperando desconexión. Forzando salida.");
    process.exit(1);
  }, 3000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
