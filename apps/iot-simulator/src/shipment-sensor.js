const { startSimulation } = require('./core/runner');
const { ChaosMqttClient } = require('./core/mqtt-client');

// Rutas base (Origen -> Destino) para generar variabilidad en la flota
const ROUTES = [
  { orig: { lat: -3.119, lng: -60.0217 }, dest: { lat: -1.4558, lng: -48.5044 }, name: "Manaos a Belém" },
  { orig: { lat: -4.2153, lng: -69.9406 }, dest: { lat: -3.119, lng: -60.0217 }, name: "Leticia a Manaos" },
  { orig: { lat: -8.7619, lng: -63.9039 }, dest: { lat: -3.119, lng: -60.0217 }, name: "Porto Velho a Manaos" },
  { orig: { lat: -3.7491, lng: -73.2538 }, dest: { lat: -4.2153, lng: -69.9406 }, name: "Iquitos a Leticia" }
];

function randomBetween(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

class ShipmentSensor {
  constructor(sensorId, routeIndex) {
    const digits = sensorId.replace(/\D/g, "") || "1";
    this.sensorId = sensorId;
    this.trackingNumber = `ORD-00${digits.padStart(3, "0")}`;
    this.containerId = `DEV-AMAZONIA-${digits.padStart(3, "0")}`;
    
    const route = ROUTES[routeIndex % ROUTES.length];
    this.routeName = route.name;
    this.routeCheckpoints = this._generateRoute(route.orig, route.dest);
    this.currentCheckpoint = 0;
    
    this.chaosClient = new ChaosMqttClient("amazonia/iot/shipment");
    this.publishInterval = null;
  }

  _generateRoute(orig, dest) {
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

  simulateShock() {
    return Math.random() < 0.1 ? randomBetween(2.0, 5.0) : randomBetween(0.1, 0.8);
  }

  publishTelemetry() {
    const checkpoint = this.routeCheckpoints[this.currentCheckpoint];
    const lat = checkpoint.lat + randomBetween(-0.005, 0.005);
    const lng = checkpoint.lng + randomBetween(-0.005, 0.005);

    const payload = {
      event_type: "shipment_telemetry",
      recorded_at: new Date().toISOString(),
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6)),
      metadata: {
        tracking_number: this.trackingNumber,
        container_id: this.containerId,
        sensor_id: this.sensorId,
      },
      business_context: {
        status: checkpoint.status,
        scan_type: "gps",
      },
      telemetry: {
        temperature_celsius: randomBetween(24, 38),
        shock_g_force: this.simulateShock(),
      }
    };

    // Caos de Formato
    const corruptProb = parseFloat(process.env.CHAOS_CORRUPT_DATA_PROBABILITY || "0.0");
    if (corruptProb > 0 && Math.random() < corruptProb) {
      console.log(`🐛 [CAOS] Inyectando datos corruptos al JSON en ${this.sensorId}...`);
      payload.latitude = "coordenada rota";
      delete payload.business_context.status;
    }

    this.chaosClient.publish(payload);

    if (!this.chaosClient.isNetworkDown && process.env.DRY_RUN !== 'true') {
      console.log(`📦 [ENVÍO] ${this.sensorId} (${this.routeName}) en ${checkpoint.name} | Estado: ${checkpoint.status}`);
    }

    if (this.currentCheckpoint < this.routeCheckpoints.length - 1) {
      this.currentCheckpoint++;
    } else {
      console.log(`🔄 Ruta completada para ${this.sensorId}. Reiniciando trayecto...`);
      this.currentCheckpoint = 0;
    }
  }

  start() {
    this.chaosClient.connect(); 
    this.publishInterval = setInterval(() => this.publishTelemetry(), 5000);
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
  const username = process.env.HIVEMQ_USERNAME || "sensor02";
  const digits = username.replace(/\D/g, "") || "2";
  const SENSOR_ID = `ORD-${digits.padStart(3, "0")}`;
  const duration = parseInt(process.env.SIMULATION_DURATION_SECONDS || 60, 10);
  
  const sensor = new ShipmentSensor(SENSOR_ID, parseInt(digits, 10));
  sensor.runSimulation(duration);
}

module.exports = { ShipmentSensor };
