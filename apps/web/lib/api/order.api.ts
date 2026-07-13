import type { ProductOrderResponseDto, OrderTimelineResponseDto, PaginatedResponseDto } from 'event-types';
import { authFetch } from './client';

export function getSellerOrders(params?: URLSearchParams): Promise<PaginatedResponseDto<ProductOrderResponseDto>> {
  const query = params ? `?${params.toString()}` : "";
  return authFetch<PaginatedResponseDto<ProductOrderResponseDto>>(`/product-order/seller-orders${query}`);
}

export function getAllOrders(params?: URLSearchParams): Promise<PaginatedResponseDto<ProductOrderResponseDto>> {
  const query = params ? `?${params.toString()}` : "";
  return authFetch<PaginatedResponseDto<ProductOrderResponseDto>>(`/product-order${query}`);
}

export function createOrder(payload: { productId: string; quantity: number; orderNotes?: string; transactionHash?: string }): Promise<ProductOrderResponseDto> {
  return authFetch<ProductOrderResponseDto>('/product-order', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getMyOrders(params?: URLSearchParams): Promise<PaginatedResponseDto<ProductOrderResponseDto>> {
  const query = params ? `?${params.toString()}` : "";
  return authFetch<PaginatedResponseDto<ProductOrderResponseDto>>(`/product-order/my-orders${query}`);
}

export function getOrder(id: string): Promise<ProductOrderResponseDto> {
  return authFetch<ProductOrderResponseDto>(`/product-order/${id}`);
}

export function getOrderTimeline(id: string): Promise<OrderTimelineResponseDto> {
  return authFetch<OrderTimelineResponseDto>(`/product-order/${id}/timeline`);
}

export function updateOrder(id: string, payload: any): Promise<ProductOrderResponseDto> {
  return authFetch<ProductOrderResponseDto>(`/product-order/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
