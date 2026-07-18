async function startSimulation(sensorName, startCallback, stopCallback, customDuration = null) {
    let durationSec = customDuration || process.env.SIMULATION_DURATION_SECONDS;
    
    // Si sigue sin haber duración, por defecto 60 segundos
    if (!durationSec) {
        durationSec = 60;
    } else {
        durationSec = parseInt(durationSec, 10);
    }

    if (isNaN(durationSec) || durationSec <= 0) {
        throw new Error("Duración inválida.");
    }

    console.log(`\n▶️  Iniciando simulador [${sensorName}] por ${durationSec} segundos...\n`);
    
    // Iniciar la lógica de los intervalos y MQTT
    startCallback();

    // Retornamos una promesa que se resuelve cuando termina la simulación
    return new Promise((resolve) => {
        setTimeout(async () => {
            console.log(`\n🛑 Tiempo límite de ${durationSec}s alcanzado para [${sensorName}]. Apagando...`);
            if (stopCallback) {
                await stopCallback();
            }
            resolve({ success: true, message: `Simulación de ${sensorName} finalizada tras ${durationSec}s` });
        }, durationSec * 1000);
    });
}

module.exports = { startSimulation };
