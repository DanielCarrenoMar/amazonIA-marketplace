import type { ProductResponseDto, PaginatedResponseDto } from 'event-types';
import { apiFetch, authFetch } from './client';

export function getProducts(params?: Record<string, any>): Promise<PaginatedResponseDto<ProductResponseDto>> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  return apiFetch<PaginatedResponseDto<ProductResponseDto>>(`/product${query}`);
}

export function getProductById(id: string): Promise<ProductResponseDto> {
  return apiFetch<ProductResponseDto>(`/product/${id}`);
}

export function getMyProducts(params?: URLSearchParams): Promise<PaginatedResponseDto<ProductResponseDto>> {
  const query = params ? `?${params.toString()}` : "";
  return authFetch<PaginatedResponseDto<ProductResponseDto>>(`/product/my-products${query}`);
}

export function createProduct(payload: any): Promise<ProductResponseDto> {
  return authFetch<ProductResponseDto>("/product", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProduct(id: string, payload: any): Promise<ProductResponseDto> {
  return authFetch<ProductResponseDto>(`/product/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteProduct(id: string): Promise<any> {
  return authFetch(`/product/${id}`, { method: "DELETE" });
}

export function uploadProductImage(id: string, file: File): Promise<ProductResponseDto> {
  const formData = new FormData();
  formData.append("file", file);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return apiFetch<ProductResponseDto>(`/product/${id}/image`, {
    method: "POST",
    headers, // Omit Content-Type so fetch sets the boundary automatically
    body: formData,
  });
}
