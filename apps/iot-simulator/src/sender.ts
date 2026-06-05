import * as mqtt from 'mqtt';
interface SenderConfig {
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  dryRun: boolean;
}
let config: SenderConfig;
let client: mqtt.MqttClient | null = null;
export function initSender(cfg: SenderConfig): void {
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
export async function sendToIngestor(
  endpoint: string, // ej. 'climate' o 'shipment'
  payload: unknown,
): Promise<void> {
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
    client!.publish(topic, JSON.stringify(payload), { qos: 1 }, (error) => {
      if (error) {
        console.error(`❌ Error al publicar en ${topic}:`, error);
        reject(error);
      } else {
        resolve();
      }
    });
  });
}