import type { ProductCategoryResponseDto, ShippingCarrierResponseDto, PaginatedResponseDto, GroupedCategoryResponseDto } from 'event-types';
import { apiFetch, authFetch } from './client';

export function getCategories(): Promise<GroupedCategoryResponseDto[]> {
  return apiFetch<GroupedCategoryResponseDto[]>("/product-category");
}

export function getShippingCarriers(): Promise<ShippingCarrierResponseDto[]> {
  return authFetch<ShippingCarrierResponseDto[]>("/shipping-carriers");
}
