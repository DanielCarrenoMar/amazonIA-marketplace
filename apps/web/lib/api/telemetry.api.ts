import type { IClimateEvent } from 'event-types';
import { authFetch } from './client';

export function getCurrentClimate(maxAgeMinutes?: number): Promise<IClimateEvent[]> {
  const query = maxAgeMinutes ? `?maxAgeMinutes=${maxAgeMinutes}` : '';
  return authFetch<IClimateEvent[]>(`/telemetry/climate/current${query}`);
}
