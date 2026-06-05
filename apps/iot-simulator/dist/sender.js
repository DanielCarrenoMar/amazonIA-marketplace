"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSender = initSender;
exports.sendToIngestor = sendToIngestor;
const mqtt = __importStar(require("mqtt"));
let config;
let client = null;
function initSender(cfg) {
    config = cfg;
    if (config.dryRun) {
        console.log('🚧 [DRY-RUN] MQTT Inicializado en modo simulación (sin conexión real)');
        return;
    }
    if (!config.host || !config.username || !config.password) {
        throw new Error('Faltan credenciales de HiveMQ en las variables de entorno (.env)');
    }
    console.log(`🔌 Conectando a HiveMQ Cloud en: ${config.host}...`);
    // Conexión idéntica a tu archivo de Prueba IoT
    client = mqtt.connect({
        host: config.host,
        port: config.port ? parseInt(config.port, 10) : 8883,
        protocol: 'mqtts', // TLS obligatorio para HiveMQ Cloud
        username: config.username,
        password: config.password,
    });
    client.on('connect', () => {
        console.log('✅ Conectado exitosamente a HiveMQ Cloud');
    });
    client.on('error', (error) => {
        console.error('❌ Error de conexión con HiveMQ:', error.message);
    });
    client.on('close', () => {
        console.log('🔌 Conexión con HiveMQ cerrada');
    });
}
/**
 * Publica un evento de telemetría a un tópico específico de MQTT.
 */
async function sendToIngestor(endpoint, // ej. 'climate' o 'shipment'
payload) {
    // El tópico de destino usando la estructura de tu proyecto
    const topic = `amazonia/iot/${endpoint}`;
    if (config.dryRun) {
        console.log(`[DRY-RUN] MQTT Publish to '${topic}':`, JSON.stringify(payload));
        return;
    }
    if (!client || !client.connected) {
        throw new Error('No hay conexión activa con el broker de HiveMQ');
    }
    return new Promise((resolve, reject) => {
        client.publish(topic, JSON.stringify(payload), { qos: 1 }, (error) => {
            if (error) {
                console.error(`❌ Error al publicar en ${topic}:`, error);
                reject(error);
            }
            else {
                resolve();
            }
        });
    });
}
//# sourceMappingURL=sender.js.map