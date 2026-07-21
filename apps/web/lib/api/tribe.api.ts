import type {
  TribeResponseDto,
  TribeMembershipRequestResponseDto,
  RequestTribeCreationDto,
  ReviewTribeCreationDto,
  RequestTribeMembershipDto,
  ReviewTribeMembershipDto,
  PaginatedResponseDto
} from 'event-types';
import { apiFetch, authFetch } from './client';

export interface TribeCrudPayload {
  name?: string;
  description?: string;
  locationMapboxId?: string;
  locationFormattedAddress?: string;
}

export function createTribeDirect(payload: TribeCrudPayload): Promise<TribeResponseDto> {
  return authFetch<TribeResponseDto>("/tribe", { method: "POST", body: JSON.stringify(payload) });
}

export function updateTribeDirect(id: number, payload: TribeCrudPayload): Promise<TribeResponseDto> {
  return authFetch<TribeResponseDto>(`/tribe/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteTribeDirect(id: number): Promise<TribeResponseDto> {
  return authFetch<TribeResponseDto>(`/tribe/${id}`, { method: "DELETE" });
}

export function requestTribeCreation(payload: RequestTribeCreationDto): Promise<TribeResponseDto> {
  return authFetch<TribeResponseDto>("/tribe/request-creation", { method: "POST", body: JSON.stringify(payload) });
}

export function requestTribeMembership(tribeId: number, payload: RequestTribeMembershipDto): Promise<TribeMembershipRequestResponseDto> {
  return authFetch<TribeMembershipRequestResponseDto>(`/tribe/${tribeId}/request-membership`, { method: "POST", body: JSON.stringify(payload) });
}

export function getActiveTribes(params?: URLSearchParams): Promise<PaginatedResponseDto<TribeResponseDto>> {
  const query = params ? `?${params.toString()}` : "";
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

export function getAllTribeMembershipRequests(params?: URLSearchParams): Promise<PaginatedResponseDto<TribeMembershipRequestResponseDto>> {
  const query = params ? `?${params.toString()}` : "";
  return authFetch<PaginatedResponseDto<TribeMembershipRequestResponseDto>>(`/tribe/all-membership-requests${query}`);
}

export function reviewTribeMembershipAsAdmin(requestId: number, payload: ReviewTribeMembershipDto): Promise<TribeMembershipRequestResponseDto> {
  return authFetch<TribeMembershipRequestResponseDto>(`/tribe/membership/${requestId}/review-admin`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function getMyTribe(): Promise<TribeResponseDto> {
  return authFetch<TribeResponseDto>("/tribe/my-tribe");
}

export function getMyMembershipRequests(): Promise<TribeMembershipRequestResponseDto[]> {
  return authFetch<TribeMembershipRequestResponseDto[]>("/tribe/my-membership-requests");
}

export function getTribe(id: number): Promise<TribeResponseDto> {
  return apiFetch<TribeResponseDto>(`/tribe/${id}`);
}

export function removeTribeMember(tribeId: number, sellerId: string): Promise<void> {
  return authFetch<void>(`/tribe/${tribeId}/members/${sellerId}`, { method: "DELETE" });
}
