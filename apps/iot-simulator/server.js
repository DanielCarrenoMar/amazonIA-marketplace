const express = require('express');
const cors = require('cors');
const path = require('path');
const { runClimateSimulation } = require('./src/climate-sensor');
const { runShipmentSimulation } = require('./src/shipment-sensor');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let isSimulationRunning = false;
let currentSimulationType = null;
let currentSimulationStartTime = null;
let currentSimulationDuration = 0;

app.post('/api/simulate/start', async (req, res) => {
  if (isSimulationRunning) {
    return res.status(400).json({ error: 'Ya hay una simulación en curso.' });
  }

  const { type, duration, networkDropProb, corruptDataProb } = req.body;
  
  if (!['climate', 'shipment'].includes(type) || !duration) {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }

  // Set environment variables for the current simulation context
  process.env.CHAOS_NETWORK_DROP_PROBABILITY = networkDropProb || '0.0';
  process.env.CHAOS_CORRUPT_DATA_PROBABILITY = corruptDataProb || '0.0';

  isSimulationRunning = true;
  currentSimulationType = type;
  currentSimulationStartTime = Date.now();
  currentSimulationDuration = parseInt(duration, 10);

  // Iniciar asíncronamente
  (async () => {
    try {
      if (type === 'climate') {
        await runClimateSimulation(currentSimulationDuration);
      } else {
        await runShipmentSimulation(currentSimulationDuration);
      }
    } catch (err) {
      console.error("❌ Error en la simulación:", err);
    } finally {
      isSimulationRunning = false;
      currentSimulationType = null;
      currentSimulationStartTime = null;
      currentSimulationDuration = 0;
    }
  })();

  res.json({ success: true, message: `Simulación de ${type} iniciada por ${duration}s.` });
});

app.get('/api/simulate/status', (req, res) => {
  if (!isSimulationRunning) {
    return res.json({ isRunning: false });
  }
  
  const elapsedSeconds = Math.floor((Date.now() - currentSimulationStartTime) / 1000);
  const remainingSeconds = Math.max(0, currentSimulationDuration - elapsedSeconds);

  res.json({
    isRunning: true,
    type: currentSimulationType,
    elapsedSeconds,
    remainingSeconds,
    duration: currentSimulationDuration
  });
});

app.listen(PORT, () => {
  console.log(`\n🌐 Servidor web de configuración escuchando en el puerto ${PORT}`);
  console.log(`➡️  Accede al panel en: http://localhost:${PORT}\n`);
});
