const { startSimulation } = require('./core/runner');
const { ChaosMqttClient } = require('./core/mqtt-client');

const WEATHER_STATIONS = [
  { lat: -3.119, lng: -60.0217, name: "Estación Manaos" },
  { lat: -2.4384, lng: -54.7308, name: "Estación Santarém" },
  { lat: -1.4558, lng: -48.5044, name: "Estación Belém" },
  { lat: -3.4653, lng: -62.2159, name: "Estación Alenquer" },
  { lat: -0.0356, lng: -51.0566, name: "Estación Macapá" },
  { lat: -3.7491, lng: -73.2538, name: "Estación Iquitos" },
  { lat: -4.2153, lng: -69.9406, name: "Estación Leticia" },
  { lat: -8.7619, lng: -63.9039, name: "Estación Porto Velho" },
  { lat: 1.4550, lng: -64.9750, name: "Estación San Carlos de Río Negro" },
  { lat: -9.9740, lng: -67.8076, name: "Estación Rio Branco" }
];

function randomBetween(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

class ClimateSensor {
  constructor(sensorId, stationIndex) {
    this.sensorId = sensorId;
    this.station = WEATHER_STATIONS[stationIndex % WEATHER_STATIONS.length];
    this.chaosClient = new ChaosMqttClient("amazonia/iot/climate");
    this.publishInterval = null;
  }

  generateClimatePayload() {
    const lat = this.station.lat + randomBetween(-0.001, 0.001);
    const lng = this.station.lng + randomBetween(-0.001, 0.001);
    
    const payload = {
      sensor_id: this.sensorId,
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
      console.log(`🐛 [CAOS] Inyectando datos corruptos al JSON en ${this.sensorId}...`);
      payload.metrics.temperature_celsius = "muy caliente"; 
      payload.metrics.unplanned_field = "esto no estaba en el esquema";
      delete payload.metrics.humidity_percent; 
    }

    return payload;
  }

  start() {
    this.chaosClient.connect(); // User/Pass read from .env in mqtt-client.js
    
    this.publishInterval = setInterval(() => {
      const payload = this.generateClimatePayload();
      this.chaosClient.publish(payload);
      
      if (!this.chaosClient.isNetworkDown && process.env.DRY_RUN !== 'true') {
        console.log(`📡 [CLIMA] ${this.sensorId} en ${this.station.name} | Temp: ${payload.metrics.temperature_celsius}`);
      }
    }, 5000);
  }

  async stop() {
    if (this.publishInterval) clearInterval(this.publishInterval);
    await this.chaosClient.disconnect();
  }

  runSimulation(durationSec) {
    return startSimulation(this.sensorId, () => this.start(), () => this.stop(), durationSec);
  }
}

// Auto-ejecución si se lanza por CLI (Modo Legacy Single-Sensor)
if (require.main === module) {
  require('dotenv').config();
  const username = process.env.HIVEMQ_USERNAME || "clima01";
  const digits = username.replace(/\D/g, "") || "1";
  const SENSOR_ID = `CLM-${digits}`;
  const duration = parseInt(process.env.SIMULATION_DURATION_SECONDS || 60, 10);
  
  const sensor = new ClimateSensor(SENSOR_ID, parseInt(digits, 10));
  sensor.runSimulation(duration);
}

module.exports = { ClimateSensor, WEATHER_STATIONS };
