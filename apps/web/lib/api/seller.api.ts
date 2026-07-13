import type { SellerMetricsResponseDto, SellerResponseDto, PaginatedResponseDto } from 'event-types';
import { authFetch, apiFetch } from './client';

export function getSeller(id: string): Promise<SellerResponseDto> {
  return apiFetch<SellerResponseDto>(`/seller/${id}`);
}

export function getSellerMetrics(): Promise<SellerMetricsResponseDto> {
  return authFetch<SellerMetricsResponseDto>("/seller/me/metrics");
}

export function registerSeller(payload: any): Promise<SellerResponseDto> {
  return authFetch<SellerResponseDto>("/seller/register-me", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function findSellers(params?: URLSearchParams): Promise<PaginatedResponseDto<SellerResponseDto>> {
  const query = params ? `?${params.toString()}` : "";
  return apiFetch<PaginatedResponseDto<SellerResponseDto>>(`/seller${query}`);
}
