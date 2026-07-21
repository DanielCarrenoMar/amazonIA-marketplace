import type { ProductCategoryResponseDto, ShippingCarrierResponseDto, PaginatedResponseDto, GroupedCategoryResponseDto } from 'event-types';
import { apiFetch, authFetch } from './client';

export function getCategories(): Promise<GroupedCategoryResponseDto[]> {
  return apiFetch<GroupedCategoryResponseDto[]>("/product-category");
}

export function createCategory(payload: { categoryName: string; subcategoryName?: string }): Promise<ProductCategoryResponseDto> {
  return authFetch<ProductCategoryResponseDto>("/product-category", { method: "POST", body: JSON.stringify(payload) });
}

export function updateCategory(id: number, payload: { categoryName?: string; subcategoryName?: string }): Promise<ProductCategoryResponseDto> {
  return authFetch<ProductCategoryResponseDto>(`/product-category/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteCategory(id: number): Promise<ProductCategoryResponseDto> {
  return authFetch<ProductCategoryResponseDto>(`/product-category/${id}`, { method: "DELETE" });
}

export function getShippingCarriers(): Promise<ShippingCarrierResponseDto[]> {
  return authFetch<ShippingCarrierResponseDto[]>("/shipping-carriers");
}
