"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const climate_generator_1 = require("./generators/climate.generator");
const shipment_generator_1 = require("./generators/shipment.generator");
const sender_1 = require("./sender");
// ---------------------------------------------------------------------------
// CLI argument parsing (simple, no external deps)
// ---------------------------------------------------------------------------
function parseArgs() {
    const args = process.argv.slice(2);
    const get = (flag, fallback) => {
        const idx = args.indexOf(flag);
        return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
    };
    return {
        mode: get('--mode', 'mixed'),
        sensors: parseInt(get('--sensors', '3'), 10),
        interval: parseInt(get('--interval', '2000'), 10),
        duration: parseInt(get('--duration', '60'), 10),
        anomalyRate: parseFloat(get('--anomaly-rate', '0.05')),
        networkLoss: parseFloat(get('--network-loss', '0.1')),
        dryRun: args.includes('--dry-run'),
    };
}
// ---------------------------------------------------------------------------
// Main simulation loop
// ---------------------------------------------------------------------------
async function main() {
    const opts = parseArgs();
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║         🌡️  AmazonIA IoT Simulator  📡          ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Mode:          ${opts.mode.padEnd(33)}║`);
    console.log(`║  Sensors:       ${String(opts.sensors).padEnd(33)}║`);
    console.log(`║  Interval:      ${(opts.interval + 'ms').padEnd(33)}║`);
    console.log(`║  Duration:      ${(opts.duration + 's').padEnd(33)}║`);
    console.log(`║  Anomaly Rate:  ${(opts.anomalyRate * 100 + '%').padEnd(33)}║`);
    console.log(`║  Network Loss:  ${(opts.networkLoss * 100 + '%').padEnd(33)}║`);
    console.log(`║  Dry Run:       ${String(opts.dryRun).padEnd(33)}║`);
    console.log('╚══════════════════════════════════════════════════╝');
    // Initialize HTTP sender
    (0, sender_1.initSender)({
        host: process.env.HIVEMQ_HOST,
        port: process.env.HIVEMQ_PORT,
        username: process.env.HIVEMQ_USERNAME,
        password: process.env.HIVEMQ_PASSWORD,
        dryRun: opts.dryRun,
    });
    let totalSent = 0;
    let totalBuffered = 0;
    const startTime = Date.now();
    const endTime = startTime + opts.duration * 1000;
    console.log('\n📡 Simulation started...\n');
    while (Date.now() < endTime) {
        const cyclePromises = [];
        for (let i = 0; i < opts.sensors; i++) {
            // Climate events
            if (opts.mode === 'climate' || opts.mode === 'mixed') {
                const event = (0, climate_generator_1.generateClimateEvent)(i, opts.anomalyRate);
                cyclePromises.push((0, sender_1.sendToIngestor)('climate', event).then(() => {
                    totalSent++;
                    process.stdout.write(`\r  📊 Sent: ${totalSent} | Buffered: ${totalBuffered} | Elapsed: ${Math.round((Date.now() - startTime) / 1000)}s`);
                }));
            }
            // Shipment events
            if (opts.mode === 'shipment' || opts.mode === 'mixed') {
                const events = (0, shipment_generator_1.generateShipmentEvent)(i, opts.networkLoss, opts.anomalyRate);
                if (events.length === 0) {
                    totalBuffered++;
                    process.stdout.write(`\r  📊 Sent: ${totalSent} | Buffered: ${totalBuffered} | Elapsed: ${Math.round((Date.now() - startTime) / 1000)}s`);
                }
                else if (events.length === 1) {
                    cyclePromises.push((0, sender_1.sendToIngestor)('shipment', events[0]).then(() => {
                        totalSent++;
                        process.stdout.write(`\r  📊 Sent: ${totalSent} | Buffered: ${totalBuffered} | Elapsed: ${Math.round((Date.now() - startTime) / 1000)}s`);
                    }));
                }
                else {
                    // Burst recovery — send as batch
                    console.log(`\n  🔄 Network recovery burst: ${events.length} buffered events flushed`);
                    cyclePromises.push((0, sender_1.sendToIngestor)('batch/shipment', events).then(() => {
                        totalSent += events.length;
                        process.stdout.write(`\r  📊 Sent: ${totalSent} | Buffered: ${totalBuffered} | Elapsed: ${Math.round((Date.now() - startTime) / 1000)}s`);
                    }));
                }
            }
        }
        await Promise.all(cyclePromises);
        // Wait for next cycle
        await new Promise((resolve) => setTimeout(resolve, opts.interval));
    }
    console.log('\n\n✅ Simulation complete!');
    console.log(`   Total events sent:     ${totalSent}`);
    console.log(`   Total events buffered: ${totalBuffered}`);
    console.log(`   Duration:              ${Math.round((Date.now() - startTime) / 1000)}s`);
}
main().catch((error) => {
    console.error('Simulation failed:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map