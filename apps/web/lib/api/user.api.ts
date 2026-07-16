import type { PaginatedResponseDto, UserAccountResponseDto } from 'event-types';
import { authFetch } from './client';

export function getAllUsers(params?: URLSearchParams): Promise<PaginatedResponseDto<UserAccountResponseDto>> {
  const query = params ? `?${params.toString()}` : "";
  return authFetch<PaginatedResponseDto<UserAccountResponseDto>>(`/user-account${query}`);
}
