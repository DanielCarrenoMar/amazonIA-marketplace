const { startSimulation } = require('./core/runner');
const { ChaosMqttClient } = require('./core/mqtt-client');

const SENSOR_TYPES = {
  BASIC: 'climate_basic',
  STANDARD: 'climate_standard',
  ADVANCED: 'climate_advanced'
};

const WEATHER_STATIONS = [
  { lat: -3.119, lng: -60.0217, name: "Estación Manaos", type: SENSOR_TYPES.ADVANCED },
  { lat: -2.4384, lng: -54.7308, name: "Estación Santarém", type: SENSOR_TYPES.STANDARD },
  { lat: -1.4558, lng: -48.5044, name: "Estación Belém", type: SENSOR_TYPES.ADVANCED },
  { lat: -3.4653, lng: -62.2159, name: "Estación Alenquer", type: SENSOR_TYPES.BASIC },
  { lat: -0.0356, lng: -51.0566, name: "Estación Macapá", type: SENSOR_TYPES.STANDARD },
  { lat: -3.7491, lng: -73.2538, name: "Estación Iquitos", type: SENSOR_TYPES.ADVANCED },
  { lat: -4.2153, lng: -69.9406, name: "Estación Leticia", type: SENSOR_TYPES.STANDARD },
  { lat: -8.7619, lng: -63.9039, name: "Estación Porto Velho", type: SENSOR_TYPES.STANDARD },
  { lat: 1.4550, lng: -64.9750, name: "Estación San Carlos de Río Negro", type: SENSOR_TYPES.BASIC },
  { lat: -9.9740, lng: -67.8076, name: "Estación Rio Branco", type: SENSOR_TYPES.BASIC }
];

function randomBetween(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

class ClimateSensor {
  constructor(sensorId, stationIndex) {
    this.sensorId = sensorId;
    this.station = WEATHER_STATIONS[stationIndex % WEATHER_STATIONS.length];
    this.type = this.station.type || SENSOR_TYPES.STANDARD;
    this.chaosClient = new ChaosMqttClient("amazonia/iot/climate");
    this.publishInterval = null;
  }

  generateClimatePayload() {
    const lat = this.station.lat + randomBetween(-0.001, 0.001);
    const lng = this.station.lng + randomBetween(-0.001, 0.001);
    
    const metrics = {
      temperature_celsius: randomBetween(24, 38),
      humidity_percent: randomBetween(60, 99),
    };

    if (this.type === SENSOR_TYPES.STANDARD || this.type === SENSOR_TYPES.ADVANCED) {
      metrics.pressure_hpa = randomBetween(1005, 1020);
      metrics.uv_index = randomBetween(1, 12);
    }

    if (this.type === SENSOR_TYPES.ADVANCED) {
      metrics.wind_speed_kmh = randomBetween(0, 25);
      metrics.wind_direction_deg = randomBetween(0, 360);
      metrics.rainfall_mm = Math.random() < 0.4 ? randomBetween(0.1, 15) : 0;
      metrics.air_quality_index = randomBetween(10, 150);
      metrics.co2_ppm = randomBetween(350, 500);
      metrics.solar_radiation_wm2 = randomBetween(100, 1000);
    }

    const payload = {
      event_type: 'environment_reading',
      sensor_id: this.sensorId,
      sensor_type: this.type,
      recorded_at: new Date().toISOString(),
      location: {
        type: "Point",
        coordinates: [parseFloat(lng.toFixed(6)), parseFloat(lat.toFixed(6))]
      },
      metrics: metrics
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
        console.log(`📡 [CLIMA] ${this.sensorId} (${this.type}) en ${this.station.name} | Temp: ${payload.metrics.temperature_celsius}`);
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

class ClimateSensorFactory {
  static createSensor(sensorId, stationIndex) {
    return new ClimateSensor(sensorId, stationIndex);
  }
}

// Auto-ejecución si se lanza por CLI (Modo Legacy Single-Sensor)
if (require.main === module) {
  require('dotenv').config();
  const username = process.env.HIVEMQ_USERNAME || "clima01";
  const digits = username.replace(/\D/g, "") || "1";
  const SENSOR_ID = `CLM-${digits}`;
  const duration = parseInt(process.env.SIMULATION_DURATION_SECONDS || 60, 10);
  
  const sensor = ClimateSensorFactory.createSensor(SENSOR_ID, parseInt(digits, 10));
  sensor.runSimulation(duration);
}

module.exports = { ClimateSensor, ClimateSensorFactory, WEATHER_STATIONS, SENSOR_TYPES };
