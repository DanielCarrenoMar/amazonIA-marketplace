const mqtt = require("mqtt");
require("dotenv").config();

const hivemqHost = process.env.HIVEMQ_HOST.trim();
const hivemqPort = Number.parseInt(process.env.HIVEMQ_PORT, 10);

const client = mqtt.connect({
  host: hivemqHost,
  port: hivemqPort,
  protocol: "mqtts",
  // Usaremos las credenciales del sensor de clima para enviar el comando,
  // (ya que el sensor02 tiene que tener permisos para escuchar)
  username: process.env.SENSOR_1_USERNAME, 
  password: process.env.SENSOR_1_PASSWORD,
});

const CONTAINER_ID = "DEV-AMAZONIA-002";
const TOPIC = `amazonia/iot/control/${CONTAINER_ID}`;

const assignmentPayload = {
  action: "START_TRANSIT",
  trackingNumber: "ORD-002",
  origin: { lat: -3.119, lng: -60.0217 },     // Manaos
  destination: { lat: -1.4558, lng: -48.5044 } // Belém
};

client.on("connect", () => {
  console.log(`\n🔗 Conectado a HiveMQ.`);
  console.log(`🚀 Enviando orden de asignación al contenedor: ${CONTAINER_ID}...`);
  
  client.publish(TOPIC, JSON.stringify(assignmentPayload), { qos: 1 }, (err) => {
    if (err) {
      console.error("❌ Error publicando:", err);
    } else {
      console.log(`✅ Señal enviada correctamente al tópico '${TOPIC}':`);
      console.log(JSON.stringify(assignmentPayload, null, 2));
    }
    client.end(); // Desconectar al terminar
  });
});

client.on("error", (error) => {
  console.error("❌ Error de conexión:", error.message);
  process.exit(1);
});
