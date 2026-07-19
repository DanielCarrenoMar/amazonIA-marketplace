const { ChaosMqttClient } = require('./core/mqtt-client');

function randomBetween(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

class ShipmentSensor {
  constructor({ sensorId, origin, destination }) {
    this.sensorId = sensorId;
    this.origin = origin || { lat: 0, lng: 0 };
    this.destination = destination || { lat: 0, lng: 0 };
    
    this.routeCheckpoints = this._generateRoute(this.origin, this.destination);
    this.currentCheckpoint = 0;
    this.state = 'IN_TRANSIT'; // 'IN_TRANSIT' | 'AT_DESTINATION' | 'STOPPED'
    
    this.chaosClient = new ChaosMqttClient("amazonia/iot/shipment");
    this.publishInterval = null;
  }

  _generateRoute(orig, dest) {
    const steps = 50;
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

  _buildTelemetry() {
    // Para simplificar, hardcodeamos el perfil según un sufijo del sensor_id si existe
    // o por defecto FULL_TELEMETRY
    let profile = 'FULL_TELEMETRY';
    if (this.sensorId.includes('GPS_BASIC')) profile = 'GPS_BASIC';
    else if (this.sensorId.includes('COLD_CHAIN')) profile = 'COLD_CHAIN';
    else if (this.sensorId.includes('IMPACT_GUARD')) profile = 'IMPACT_GUARD';
    else if (this.sensorId.includes('AMBIENT_MONITOR')) profile = 'AMBIENT_MONITOR';
    const telemetry = {
      battery_level_pct: randomBetween(80, 100),
    };

    switch (profile) {
      case 'GPS_BASIC':
        // Solo ubicación y señal
        telemetry.signal_strength_dbm = randomBetween(-90, -40);
        break;
      case 'COLD_CHAIN':
        telemetry.temperature_celsius = randomBetween(2, 8);
        telemetry.humidity_percent = randomBetween(40, 60);
        telemetry.door_open_count = Math.random() < 0.05 ? 1 : 0;
        break;
      case 'IMPACT_GUARD':
        telemetry.shock_g_force = this.simulateShock();
        telemetry.tilt_angle_deg = randomBetween(0, 15);
        telemetry.vibration_hz = randomBetween(10, 50);
        break;
      case 'AMBIENT_MONITOR':
        telemetry.temperature_celsius = randomBetween(20, 25);
        telemetry.humidity_percent = randomBetween(45, 55);
        telemetry.pressure_hpa = randomBetween(1000, 1020);
        telemetry.air_quality_index = randomBetween(10, 50);
        break;
      case 'FULL_TELEMETRY':
      default:
        telemetry.signal_strength_dbm = randomBetween(-90, -40);
        telemetry.temperature_celsius = randomBetween(24, 38);
        telemetry.humidity_percent = randomBetween(40, 70);
        telemetry.shock_g_force = this.simulateShock();
        telemetry.tilt_angle_deg = randomBetween(0, 15);
        telemetry.vibration_hz = randomBetween(10, 50);
        telemetry.door_open_count = 0;
        telemetry.tamper_detected = false;
        telemetry.pressure_hpa = randomBetween(1000, 1020);
        telemetry.air_quality_index = randomBetween(10, 50);
        break;
    }

    return telemetry;
  }

  publishTelemetry() {
    if (this.state === 'AT_DESTINATION') {
      return; // El intervalo de heartbeat se encarga ahora
    }

    const checkpoint = this.routeCheckpoints[this.currentCheckpoint];
    const lat = checkpoint.lat + randomBetween(-0.005, 0.005);
    const lng = checkpoint.lng + randomBetween(-0.005, 0.005);

    const payload = {
      sensor_id: this.sensorId,
      recorded_at: new Date().toISOString(),
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      telemetry: this._buildTelemetry()
    };

    // Caos de Formato
    const corruptProb = parseFloat(process.env.CHAOS_CORRUPT_DATA_PROBABILITY || "0.0");
    if (corruptProb > 0 && Math.random() < corruptProb) {
      console.log(`🐛 [CAOS] Inyectando datos corruptos al JSON en ${this.sensorId}...`);
      payload.lat = "coordenada rota";
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
      sensor_id: this.sensorId,
      recorded_at: new Date().toISOString(),
      lat: parseFloat(this.destination.lat.toFixed(6)),
      lng: parseFloat(this.destination.lng.toFixed(6)),
      telemetry: this._buildTelemetry()
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
