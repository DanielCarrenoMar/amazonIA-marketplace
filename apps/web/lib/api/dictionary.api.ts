import type { ProductCategoryResponseDto, ShippingCarrierResponseDto, PaginatedResponseDto } from 'event-types';
import { apiFetch, authFetch } from './client';

export function getCategories(): Promise<PaginatedResponseDto<ProductCategoryResponseDto>> {
  return apiFetch<PaginatedResponseDto<ProductCategoryResponseDto>>("/product-category");
}

export function getShippingCarriers(): Promise<ShippingCarrierResponseDto[]> {
  return authFetch<ShippingCarrierResponseDto[]>("/shipping-carriers");
}
