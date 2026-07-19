const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const SIMULATOR_USERNAME = process.env.SIMULATOR_USERNAME;
const SIMULATOR_PASSWORD = process.env.SIMULATOR_PASSWORD;

if (!SIMULATOR_USERNAME || !SIMULATOR_PASSWORD) {
  console.error("❌ ERROR CRÍTICO: Las credenciales SIMULATOR_USERNAME y SIMULATOR_PASSWORD deben estar definidas en el .env por motivos de seguridad.");
  process.exit(1);
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === SIMULATOR_USERNAME && password === SIMULATOR_PASSWORD) {
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Credenciales incorrectas' });
  }
});

app.use('/api/simulate', (req, res, next) => {
  const auth = req.headers.authorization;
  const expectedToken = `Bearer ${Buffer.from(`${SIMULATOR_USERNAME}:${SIMULATOR_PASSWORD}`).toString('base64')}`;
  
  if (auth === expectedToken) {
    next();
  } else {
    res.status(401).json({ error: 'No autorizado' });
  }
});

const simState = {
  climate: { isRunning: false, startTime: null, duration: 0 },
  shipment: { isRunning: false, startTime: null, duration: 0 }
};

app.post('/api/simulate/start', async (req, res) => {
  const { 
    type, duration, fleetSize, dryRun, networkDropProb, corruptDataProb,
    telemetryInterval, routeSteps, stepsPerTick, chaosShockProb, chaosDoorOpenProb 
  } = req.body;
  
  if (!['climate', 'shipment'].includes(type) || !duration) {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }

  const state = simState[type];
  if (state.isRunning) {
    return res.status(400).json({ error: `Ya hay una simulación de ${type} en curso.` });
  }

  const numFleet = Math.min(Math.max(parseInt(fleetSize, 10) || 1, 1), 20); // Hardcoded limit 20

  // Set environment variables for the current simulation context
  process.env.DRY_RUN = dryRun ? 'true' : 'false';
  process.env.CHAOS_NETWORK_DROP_PROBABILITY = networkDropProb || '0.0';
  process.env.CHAOS_CORRUPT_DATA_PROBABILITY = corruptDataProb || '0.0';
  process.env.TELEMETRY_INTERVAL_MS = telemetryInterval || process.env.TELEMETRY_INTERVAL_MS || '5000';
  process.env.ROUTE_STEPS = routeSteps || process.env.ROUTE_STEPS || '50';
  process.env.STEPS_PER_TICK = stepsPerTick || process.env.STEPS_PER_TICK || '1';
  process.env.CHAOS_SHOCK_PROBABILITY = chaosShockProb || process.env.CHAOS_SHOCK_PROBABILITY || '0.1';
  process.env.CHAOS_DOOR_OPEN_PROBABILITY = chaosDoorOpenProb || process.env.CHAOS_DOOR_OPEN_PROBABILITY || '0.05';

  state.isRunning = true;
  state.startTime = Date.now();
  state.duration = parseInt(duration, 10);

  // Iniciar asíncronamente la flota
  (async () => {
    try {
      const fleetPromises = [];
      
      const { ClimateSensorFactory } = require('./climate-sensor');
      const { ShipmentSensor } = require('./shipment-sensor');

      if (type === 'climate') {
        for (let i = 0; i < numFleet; i++) {
          const sensorId = `CLM-${(i + 1).toString().padStart(3, '0')}`;
          const sensor = ClimateSensorFactory.createSensor(sensorId, i);
          fleetPromises.push(sensor.runSimulation(state.duration));
        }
        
        console.log(`\n🚀 [FLOTA] Iniciando ${numFleet} sensores de clima...`);
        await Promise.all(fleetPromises);
        console.log(`✅ [FLOTA] Simulación de clima finalizada.\n`);
      } else if (type === 'shipment') {
        console.log(`\n🚀 [FLOTA] Iniciando Fleet Manager de envíos por ${state.duration}s...`);
        
        const activeSensors = new Map();
        
        const pollActiveOrders = async () => {
          const API_URL = process.env.AMAZONIA_API_URL || 'http://localhost:3001';
          const token = process.env.SIMULATOR_API_TOKEN;
          if (!token) {
            console.error('❌ SIMULATOR_API_TOKEN no configurado.');
            return;
          }
          
          try {
            const res = await fetch(`${API_URL}/shipments/active-sensors`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const orders = await res.json();
            const activeIds = new Set(orders.map(o => o.sensorId));

            // Arrancar nuevos
            for (const order of orders) {
              if (!activeSensors.has(order.sensorId)) {
                const sensor = new ShipmentSensor({
                  sensorId: order.sensorId,
                  origin: order.originCoords,
                  destination: order.destinationCoords,
                });
                sensor.start();
                activeSensors.set(order.sensorId, sensor);
                console.log(`🟢 [FLEET] Nuevo sensor arrancado: ${order.sensorId} (${order.trackingNumber})`);
              }
            }

            // Detener cerrados
            for (const [sensorId, sensor] of activeSensors.entries()) {
              if (!activeIds.has(sensorId)) {
                await sensor.stop();
                activeSensors.delete(sensorId);
                console.log(`🔴 [FLEET] Sensor detenido (orden cerrada): ${sensorId}`);
              }
            }
          } catch (err) {
            console.warn(`⚠️ [FLEET] No se pudo contactar la API: ${err.message}`);
          }
        };

        await pollActiveOrders();
        const pollInterval = parseInt(process.env.FLEET_POLL_INTERVAL_SECONDS || 30, 10) * 1000;
        const fleetPollInterval = setInterval(pollActiveOrders, pollInterval);

        // Esperar que transcurra la duración
        await new Promise(resolve => setTimeout(resolve, state.duration * 1000));
        
        clearInterval(fleetPollInterval);
        for (const [_, sensor] of activeSensors.entries()) {
          await sensor.stop();
        }
        activeSensors.clear();
        console.log(`✅ [FLOTA] Simulación de envíos finalizada.\n`);
      }
    } catch (err) {
      console.error(`❌ Error en la simulación de flota (${type}):`, err);
    } finally {
      state.isRunning = false;
      state.startTime = null;
      state.duration = 0;
    }
  })();

  res.json({ success: true, message: `Simulación de flota (${numFleet} sensores) de ${type} iniciada por ${duration}s.` });
});

app.get('/api/simulate/status', (req, res) => {
  const status = { 
    climate: { isRunning: false }, 
    shipment: { isRunning: false } 
  };
  
  let anyRunning = false;
  
  for (const type of ['climate', 'shipment']) {
    const state = simState[type];
    if (state.isRunning) {
      anyRunning = true;
      const elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
      const remainingSeconds = Math.max(0, state.duration - elapsedSeconds);
      status[type] = {
        isRunning: true,
        remainingSeconds,
        elapsedSeconds
      };
    }
  }

  res.json({
    isRunning: anyRunning,
    simulations: status
  });
});

app.listen(PORT, () => {
  console.log(`\n🌐 Servidor web de configuración escuchando en el puerto ${PORT}`);
  console.log(`➡️  Accede al panel en: http://localhost:${PORT}\n`);
});
