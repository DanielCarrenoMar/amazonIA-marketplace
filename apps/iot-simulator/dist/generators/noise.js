"use strict";
/**
 * Statistical noise generators for realistic IoT data simulation.
 *
 * Used to train anomaly detection models under realistic conditions:
 *  - Gaussian noise simulates normal sensor variance
 *  - Log-normal noise simulates rare impact events (g-force)
 *  - Bernoulli trials simulate network packet loss
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gaussianNoise = gaussianNoise;
exports.logNormalNoise = logNormalNoise;
exports.simulateNetworkLoss = simulateNetworkLoss;
exports.clamp = clamp;
exports.roundTo = roundTo;
/**
 * Box-Muller transform: generates Gaussian (normal) distributed random values.
 *
 * @param mean   - Center of the distribution (μ)
 * @param stddev - Standard deviation (σ)
 * @returns A random value from N(mean, stddev²)
 */
function gaussianNoise(mean, stddev) {
    // Box-Muller generates two independent standard normal values;
    // we discard one for simplicity.
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stddev;
}
/**
 * Log-normal distribution — useful for values that are always positive
 * and have a long right tail (e.g., shock/g-force impacts).
 *
 * @param mean   - μ of the underlying normal distribution
 * @param stddev - σ of the underlying normal distribution
 */
function logNormalNoise(mean, stddev) {
    return Math.exp(gaussianNoise(mean, stddev));
}
/**
 * Simulates network packet loss using a Bernoulli trial.
 *
 * @param lossRate - Probability of loss (0.0 to 1.0)
 * @returns true if the packet is "lost" (should be buffered, not sent)
 */
function simulateNetworkLoss(lossRate) {
    return Math.random() < lossRate;
}
/**
 * Clamp a value to a min/max range.
 * Prevents physically impossible readings (e.g., humidity > 100%).
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
/**
 * Round to N decimal places (for cleaner JSON output).
 */
function roundTo(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}
//# sourceMappingURL=noise.js.map