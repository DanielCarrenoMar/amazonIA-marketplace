import type { SpatialRiskQuery } from 'event-types';
import { apiFetch, authFetch } from './client';

export function getSpatialRisk(query: SpatialRiskQuery): Promise<any> {
  const params = new URLSearchParams();
  params.append('lat', query.lat.toString());
  params.append('lon', query.lon.toString());
  if (query.transportType) params.append('transportType', query.transportType);
  if (query.productType) params.append('productType', query.productType);

  return apiFetch<any>(`/inference/spatial-risk?${params.toString()}`);
}

export function evaluateRisk(payload: any): Promise<any> {
  return authFetch<any>('/inference/evaluate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
