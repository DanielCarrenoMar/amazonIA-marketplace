const readline = require('readline');

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

async function startSimulation(sensorName, startCallback, stopCallback) {
    let durationSec = process.env.SIMULATION_DURATION_SECONDS;
    
    // Si no se proveyó en el .env o por argumento, preguntamos interactivamente
    if (!durationSec) {
        const answer = await askQuestion(`⏳ Ingresa la duración de la simulación en segundos para ${sensorName} (ej. 60): `);
        durationSec = parseInt(answer, 10);
    } else {
        durationSec = parseInt(durationSec, 10);
    }

    if (isNaN(durationSec) || durationSec <= 0) {
        console.error("❌ Duración inválida. Saliendo...");
        process.exit(1);
    }

    console.log(`\n▶️  Iniciando simulador [${sensorName}] por ${durationSec} segundos...\n`);
    
    // Iniciar la lógica de los intervalos y MQTT
    startCallback();

    // Configurar el temporizador de tiempo de vida
    setTimeout(async () => {
        console.log(`\n🛑 Tiempo límite de ${durationSec}s alcanzado para [${sensorName}]. Apagando...`);
        if (stopCallback) {
            await stopCallback();
        }
        process.exit(0);
    }, durationSec * 1000);
}

module.exports = { startSimulation };
