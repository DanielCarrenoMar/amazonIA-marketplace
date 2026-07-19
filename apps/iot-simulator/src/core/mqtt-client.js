const mqtt = require("mqtt");
require("dotenv").config();

class ChaosMqttClient {
  constructor(topic) {
    this.topic = topic;
    this.client = null;
    this.messageQueue = [];
    this.isNetworkDown = false;
    this.networkDropProb = parseFloat(process.env.CHAOS_NETWORK_DROP_PROBABILITY || "0.0");
    this.isConnected = false;
  }

  connect(username, password) {
    if (process.env.DRY_RUN === 'true') {
      console.log(`✅ [MQTT - DRY RUN] Conexión simulada (Tópico: ${this.topic})`);
      this.isConnected = true;
      return;
    }

    const hivemqHost = process.env.HIVEMQ_HOST ? process.env.HIVEMQ_HOST.trim() : null;
    if (!hivemqHost) {
      console.error("❌ [MQTT] Error: 'HIVEMQ_HOST' no está definido en el archivo .env");
      return;
    }
    
    const hivemqPort = Number.parseInt(process.env.HIVEMQ_PORT, 10);
    
    this.client = mqtt.connect({
      host: hivemqHost,
      port: hivemqPort,
      protocol: "mqtts",
      username: username || process.env.HIVEMQ_USERNAME,
      password: password || process.env.HIVEMQ_PASSWORD,
      connectTimeout: 15000,
      reconnectPeriod: 5000,
    });

    this.client.on("connect", () => {
      this.isConnected = true;
      console.log(`✅ [MQTT] Conectado a HiveMQ (Tópico: ${this.topic})`);
      this._flushQueue();
    });

    this.client.on("error", (error) => {
      console.error(`❌ [MQTT] Error de conexión:`, error.message);
    });
    
    this.client.on("offline", () => {
      this.isConnected = false;
    });
  }

  // Lógica del caos: determinar si la red se cae
  _simulateNetworkChaos() {
    if (this.networkDropProb > 0 && Math.random() < this.networkDropProb) {
      if (!this.isNetworkDown) {
        console.log("🌪️ [CAOS] ¡Se cayó la red satelital! Guardando mensajes en caché local...");
        this.isNetworkDown = true;
        // Simular que vuelve después de un tiempo aleatorio (ej. 5 a 15 segundos)
        const recoveryTime = Math.floor(Math.random() * 10000) + 5000;
        setTimeout(() => {
          console.log("📶 [CAOS] La red ha vuelto. Enviando mensajes retrasados...");
          this.isNetworkDown = false;
          this._flushQueue();
        }, recoveryTime);
      }
    }
  }

  _flushQueue() {
    if (this.messageQueue.length > 0 && this.isConnected && !this.isNetworkDown) {
      console.log(`🚀 [MQTT] Enviando ráfaga de ${this.messageQueue.length} mensajes atrasados...`);
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift();
        if (process.env.DRY_RUN === 'true') {
          console.log(`[DRY RUN PUBLISH BATCH]:`, msg);
        } else {
          this.client.publish(this.topic, JSON.stringify(msg), { qos: 1 });
        }
      }
    }
  }

  publish(payload) {
    this._simulateNetworkChaos();

    if (this.isNetworkDown || !this.isConnected) {
      this.messageQueue.push(payload);
    } else {
      if (process.env.DRY_RUN === 'true') {
        console.log(`[DRY RUN PUBLISH]:`, payload);
      } else {
        this.client.publish(this.topic, JSON.stringify(payload), { qos: 1 });
      }
    }
  }

  async disconnect() {
    this.isNetworkDown = false; // Forzar que no haya red caída para intentar vaciar
    this._flushQueue();
    
    if (process.env.DRY_RUN === 'true') {
      console.log("🔌 [MQTT - DRY RUN] Conexión cerrada limpiamente.");
      return;
    }

    if (this.client) {
      return new Promise((resolve) => {
        this.client.end(false, {}, () => {
          console.log("🔌 [MQTT] Conexión cerrada limpiamente.");
          resolve();
        });
      });
    }
  }
}

module.exports = { ChaosMqttClient };
