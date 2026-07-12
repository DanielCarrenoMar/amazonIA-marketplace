import type { SellerMetricsResponseDto, SellerResponseDto } from 'event-types';
import { authFetch } from './client';

export function getSellerMetrics(): Promise<SellerMetricsResponseDto> {
  return authFetch<SellerMetricsResponseDto>("/seller/me/metrics");
}

export function registerSeller(payload: any): Promise<SellerResponseDto> {
  return authFetch<SellerResponseDto>("/seller/register-me", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
