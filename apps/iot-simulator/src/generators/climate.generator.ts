import {
  CreateClimateEventDto,
  IoTEventType,
  SensorType,
} from 'event-types';
import { gaussianNoise, clamp, roundTo } from './noise';

// ---- Simulated facilities (warehouses in Mexico) ----

const FACILITIES = [
  { id: 'warehouse_mexico_city', coords: [-99.1332, 19.4326] as [number, number] },
  { id: 'warehouse_guadalajara', coords: [-103.3496, 20.6596] as [number, number] },
  { id: 'warehouse_monterrey', coords: [-100.3161, 25.6866] as [number, number] },
  { id: 'cold_storage_cancun', coords: [-86.8515, 21.1619] as [number, number] },
  { id: 'cold_storage_merida', coords: [-89.5926, 20.9674] as [number, number] },
];

/**
 * Generates a realistic climate event from a fixed warehouse sensor.
 *
 * Normal operating conditions:
 *   Temperature: μ=22°C, σ=2°C (standard warehouse)
 *   Humidity:    μ=45%, σ=5%
 *
 * Anomaly injection (simulating HVAC failure):
 *   Temperature spike to 38-45°C with probability = anomalyRate
 *
 * @param sensorIndex - Unique index for this simulated sensor
 * @param anomalyRate - Probability of generating an anomalous reading (0.0-1.0)
 */
export function generateClimateEvent(
  sensorIndex: number,
  anomalyRate: number = 0.05,
): CreateClimateEventDto {
  const facility = FACILITIES[sensorIndex % FACILITIES.length];
  const isAnomaly = Math.random() < anomalyRate;

  // Normal vs anomalous temperature
  const temperature = isAnomaly
    ? roundTo(gaussianNoise(42, 3), 1) // HVAC failure: hot spike
    : roundTo(gaussianNoise(22, 2), 1);

  const humidity = roundTo(
    clamp(gaussianNoise(45, 5), 0, 100),
    1,
  );

  // Determine sensor type based on facility name
  const sensorType = facility.id.startsWith('cold_storage')
    ? SensorType.FIXED_COLD_STORAGE
    : SensorType.FIXED_HVAC;

  return {
    event_type: IoTEventType.ENVIRONMENT_READING,
    recorded_at: new Date().toISOString(),
    metadata: {
      sensor_id: `wh-sensor-${String(sensorIndex).padStart(3, '0')}`,
      facility_id: facility.id,
      sensor_type: sensorType,
    },
    location: {
      type: 'Point',
      coordinates: facility.coords,
    },
    telemetry: {
      temperature_celsius: temperature,
      humidity_percent: humidity,
    },
  };
}
