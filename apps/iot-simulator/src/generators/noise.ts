/**
 * Statistical noise generators for realistic IoT data simulation.
 *
 * Used to train anomaly detection models under realistic conditions:
 *  - Gaussian noise simulates normal sensor variance
 *  - Log-normal noise simulates rare impact events (g-force)
 *  - Bernoulli trials simulate network packet loss
 */

/**
 * Box-Muller transform: generates Gaussian (normal) distributed random values.
 *
 * @param mean   - Center of the distribution (μ)
 * @param stddev - Standard deviation (σ)
 * @returns A random value from N(mean, stddev²)
 */
export function gaussianNoise(mean: number, stddev: number): number {
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
export function logNormalNoise(mean: number, stddev: number): number {
  return Math.exp(gaussianNoise(mean, stddev));
}

/**
 * Simulates network packet loss using a Bernoulli trial.
 *
 * @param lossRate - Probability of loss (0.0 to 1.0)
 * @returns true if the packet is "lost" (should be buffered, not sent)
 */
export function simulateNetworkLoss(lossRate: number): boolean {
  return Math.random() < lossRate;
}

/**
 * Clamp a value to a min/max range.
 * Prevents physically impossible readings (e.g., humidity > 100%).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Round to N decimal places (for cleaner JSON output).
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
