import type {
  UserMeResponseDto,
  ProductResponseDto,
  PaginatedResponseDto,
  SellerMetricsResponseDto,
  ProductOrderResponseDto,
  OrderTimelineResponseDto,
  ShippingCarrierResponseDto,
  ProductCategoryResponseDto,
  SellerResponseDto,
  LoginDto,
  AuthResponseDto,
  CreateUserAccountDto,
  RequestTribeCreationDto,
  ReviewTribeCreationDto,
  RequestTribeMembershipDto,
  ReviewTribeMembershipDto,
  TribeResponseDto,
  TribeMembershipRequestResponseDto
} from './types';

export interface SpatialRiskQuery {
  lat: number;
  lon: number;
  transportType?: string;
  productType?: string;
}
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";



// Helper interno original
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  // Intentar refrescar el token si da 401 (Unauthorized)
  if (res.status === 401 && typeof window !== 'undefined' && path !== '/auth/refresh') {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const { accessToken: newAccess, refreshToken: newRefresh } = await refreshRes.json();
          localStorage.setItem("accessToken", newAccess);
          localStorage.setItem("refreshToken", newRefresh);

          // Reintentar la petición original con el nuevo token
          const newHeaders = new Headers(options.headers || {});
          newHeaders.set("Content-Type", "application/json");
          newHeaders.set("Authorization", `Bearer ${newAccess}`);

          res = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: newHeaders,
          });
        } else {
          // Si el refresh falla, limpiamos la sesión
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      } catch (err) {
        // Ignoramos el error del refresh
      }
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const rawMessage = body.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage[0]
      : rawMessage ?? "Error desconocido";
    const err: any = new Error(message);
    err.status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}

// Helper autenticado
export async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!options.body || typeof options.body === 'string') {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  return apiFetch<T>(path, { ...options, headers });
}

// ==========================================
// AUTH & USERS
// ==========================================
export function registerUser(payload: CreateUserAccountDto): Promise<AuthResponseDto> {
  return apiFetch<AuthResponseDto>("/auth/register", { method: "POST", body: JSON.stringify(payload) });
}

export function loginUser(payload: LoginDto): Promise<AuthResponseDto> {
  return apiFetch<AuthResponseDto>("/auth/login", { method: "POST", body: JSON.stringify(payload) });
}

export function getMe(): Promise<UserMeResponseDto> {
  return authFetch<UserMeResponseDto>("/auth/me");
}

// ==========================================
// SELLER
// ==========================================
export function getSellerMetrics(): Promise<SellerMetricsResponseDto> {
  return authFetch<SellerMetricsResponseDto>("/seller/me/metrics");
}

export function registerSeller(payload: any): Promise<SellerResponseDto> {
  return authFetch<SellerResponseDto>("/seller/register-me", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ==========================================
// TRIBE
// ==========================================
export function requestTribeCreation(payload: RequestTribeCreationDto): Promise<TribeResponseDto> {
  return authFetch<TribeResponseDto>("/tribe/request-creation", { method: "POST", body: JSON.stringify(payload) });
}

export function requestTribeMembership(tribeId: number, payload: RequestTribeMembershipDto): Promise<TribeMembershipRequestResponseDto> {
  return authFetch<TribeMembershipRequestResponseDto>(`/tribe/${tribeId}/request-membership`, { method: "POST", body: JSON.stringify(payload) });
}

export function getActiveTribes(params?: URLSearchParams): Promise<PaginatedResponseDto<TribeResponseDto>> {
  const query = params ? `?${params.toString()}` : "?status=ACTIVE";
  return apiFetch<PaginatedResponseDto<TribeResponseDto>>(`/tribe${query}`);
}

export function getMyCreationRequests(): Promise<TribeResponseDto[]> {
  return authFetch<TribeResponseDto[]>("/tribe/my-creation-requests");
}

export function getPendingTribeCreations(params?: URLSearchParams): Promise<PaginatedResponseDto<TribeResponseDto>> {
  const query = params ? `?${params.toString()}` : "";
  return authFetch<PaginatedResponseDto<TribeResponseDto>>(`/tribe/pending-creations${query}`);
}

export function reviewTribeCreation(id: number, payload: ReviewTribeCreationDto): Promise<TribeResponseDto> {
  return authFetch<TribeResponseDto>(`/tribe/${id}/review-creation`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function getTribeMembershipRequests(tribeId: number, params?: URLSearchParams): Promise<PaginatedResponseDto<TribeMembershipRequestResponseDto>> {
  const query = params ? `?${params.toString()}` : "";
  return authFetch<PaginatedResponseDto<TribeMembershipRequestResponseDto>>(`/tribe/${tribeId}/membership-requests${query}`);
}

export function reviewTribeMembership(tribeId: number, requestId: number, payload: ReviewTribeMembershipDto): Promise<TribeMembershipRequestResponseDto> {
  return authFetch<TribeMembershipRequestResponseDto>(`/tribe/${tribeId}/membership/${requestId}/review`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function getMyTribe(): Promise<TribeResponseDto> {
  return authFetch<TribeResponseDto>("/tribe/my-tribe");
}

// ==========================================
// PRODUCTS
// ==========================================
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

// ==========================================
// ORDERS
// ==========================================
export function getSellerOrders(params?: URLSearchParams): Promise<PaginatedResponseDto<ProductOrderResponseDto>> {
  const query = params ? `?${params.toString()}` : "";
  return authFetch<PaginatedResponseDto<ProductOrderResponseDto>>(`/product-order/seller-orders${query}`);
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

// ==========================================
// DICTIONARIES (Categories, Carriers)
// ==========================================
export function getCategories(): Promise<ProductCategoryResponseDto[]> {
  return apiFetch<ProductCategoryResponseDto[]>("/product-category");
}

export function getShippingCarriers(): Promise<ShippingCarrierResponseDto[]> {
  return authFetch<ShippingCarrierResponseDto[]>("/shipping-carriers");
}

// ==========================================
// INFERENCE
// ==========================================
export interface SpatialRiskQuery {
  lat: number;
  lon: number;
  transportType?: string;
  productType?: string;
}

export function getSpatialRisk(query: SpatialRiskQuery): Promise<any> {
  const params = new URLSearchParams();
  params.append('lat', query.lat.toString());
  params.append('lon', query.lon.toString());
  if (query.transportType) params.append('transportType', query.transportType);
  if (query.productType) params.append('productType', query.productType);
  
  return apiFetch<any>(`/inference/spatial-risk?${params.toString()}`);
}