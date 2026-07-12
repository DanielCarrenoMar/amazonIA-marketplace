import type { ProductResponseDto, PaginatedResponseDto, ProductMetricsDto } from 'event-types';
import { apiFetch, authFetch } from './client';

export function getProducts(params?: Record<string, any>): Promise<PaginatedResponseDto<ProductResponseDto>> {
  const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : "";
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

export function getProductMetrics(id: string): Promise<ProductMetricsDto> {
  return authFetch<ProductMetricsDto>(`/product/${id}/metrics`);
}

export function deleteProductImage(id: string): Promise<ProductResponseDto> {
  return authFetch<ProductResponseDto>(`/product/${id}/image`, {
    method: "DELETE",
  });
}

export function getProductRatings(productId: string, params?: Record<string, any>): Promise<PaginatedResponseDto<any>> {
  const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : "";
  return apiFetch<PaginatedResponseDto<any>>(`/product-rating/product/${productId}${query}`);
}

export function getProductComments(productId: string, params?: Record<string, any>): Promise<any[]> {
  const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : "";
  return apiFetch<any[]>(`/product-comment/product/${productId}${query}`);
}

export function createProductComment(payload: any): Promise<any> {
  return authFetch<any>("/product-comment", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createProductRating(payload: any): Promise<any> {
  return authFetch<any>("/product-rating", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
