import type { ProductCategoryResponseDto, ShippingCarrierResponseDto } from 'event-types';
import { apiFetch, authFetch } from './client';

export function getCategories(): Promise<ProductCategoryResponseDto[]> {
  return apiFetch<ProductCategoryResponseDto[]>("/product-category");
}

export function getShippingCarriers(): Promise<ShippingCarrierResponseDto[]> {
  return authFetch<ShippingCarrierResponseDto[]>("/shipping-carriers");
}
