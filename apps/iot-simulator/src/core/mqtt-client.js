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
    const hivemqHost = process.env.HIVEMQ_HOST.trim();
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
      // Iteramos rápido pero uno a uno para respetar el contrato del backend
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift();
        this.client.publish(this.topic, JSON.stringify(msg), { qos: 1 });
      }
    }
  }

  publish(payload) {
    this._simulateNetworkChaos();

    if (this.isNetworkDown || !this.isConnected) {
      this.messageQueue.push(payload);
    } else {
      this.client.publish(this.topic, JSON.stringify(payload), { qos: 1 });
    }
  }

  async disconnect() {
    if (this.client) {
      this.isNetworkDown = false; // Forzar que no haya red caída para intentar vaciar
      this._flushQueue();
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
