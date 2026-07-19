const { ChaosMqttClient } = require('./core/mqtt-client');

function randomBetween(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

class ShipmentSensor {
  constructor({ sensorId, trackingNumber, origin, destination }) {
    this.sensorId = sensorId;
    this.trackingNumber = trackingNumber;
    this.origin = origin || { lat: 0, lng: 0 };
    this.destination = destination || { lat: 0, lng: 0 };
    
    this.routeCheckpoints = this._generateRoute(this.origin, this.destination);
    this.currentCheckpoint = 0;
    this.state = 'IN_TRANSIT'; // 'IN_TRANSIT' | 'AT_DESTINATION' | 'STOPPED'
    
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
    if (this.state === 'AT_DESTINATION') {
      return; // El intervalo de heartbeat se encarga ahora
    }

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
        sensor_id: this.sensorId,
      },
      business_context: {
        status: checkpoint.status,
        scan_type: "gps",
      },
      telemetry: {
        temperature_celsius: randomBetween(24, 38),
        shock_g_force: this.simulateShock(),
        battery_level_pct: randomBetween(80, 100),
      }
    };

    // Caos de Formato
    const corruptProb = parseFloat(process.env.CHAOS_CORRUPT_DATA_PROBABILITY || "0.0");
    if (corruptProb > 0 && Math.random() < corruptProb) {
      console.log(`🐛 [CAOS] Inyectando datos corruptos al JSON en ${this.sensorId}...`);
      payload.latitude = "coordenada rota";
      if (payload.business_context) delete payload.business_context.status;
    }

    this.chaosClient.publish(payload);

    if (!this.chaosClient.isNetworkDown && process.env.DRY_RUN !== 'true') {
      console.log(`📦 [ENVÍO] ${this.sensorId} en ${checkpoint.name} | Estado: ${checkpoint.status}`);
    }

    if (this.currentCheckpoint < this.routeCheckpoints.length - 1) {
      this.currentCheckpoint++;
    } else {
      this.state = 'AT_DESTINATION';
      console.log(`📦 [ENTREGA] ${this.sensorId} llegó a destino. Entrando en modo heartbeat.`);
      clearInterval(this.publishInterval);
      this.publishInterval = setInterval(() => this.publishHeartbeat(), 30000);
    }
  }

  publishHeartbeat() {
    const payload = {
      event_type: 'shipment_telemetry',
      recorded_at: new Date().toISOString(),
      latitude: parseFloat(this.destination.lat.toFixed(6)),
      longitude: parseFloat(this.destination.lng.toFixed(6)),
      metadata: {
        tracking_number: this.trackingNumber,
        sensor_id: this.sensorId,
      },
      business_context: {
        status: 'delivered',
        scan_type: 'gps',
      },
      telemetry: {
        temperature_celsius: randomBetween(24, 32),
        battery_level_pct: randomBetween(70, 95),
      }
    };
    
    // DRY_RUN checks
    if (!this.chaosClient.isNetworkDown && process.env.DRY_RUN !== 'true') {
      console.log(`💓 [HEARTBEAT] ${this.sensorId} sigue en destino.`);
    }

    this.chaosClient.publish(payload);
  }

  start() {
    this.chaosClient.connect(); 
    this.publishInterval = setInterval(() => this.publishTelemetry(), 5000);
  }

  async stop() {
    this.state = 'STOPPED';
    if (this.publishInterval) clearInterval(this.publishInterval);
    await this.chaosClient.disconnect();
    console.log(`🔴 [SENSOR] ${this.sensorId} detenido. Orden completada.`);
  }
}

module.exports = { ShipmentSensor };
