import type { AuthResponseDto, CreateUserAccountDto, LoginDto, UserMeResponseDto } from 'event-types';
import { apiFetch, authFetch } from './client';

export function registerUser(payload: CreateUserAccountDto): Promise<AuthResponseDto> {
  return apiFetch<AuthResponseDto>("/auth/register", { method: "POST", body: JSON.stringify(payload) });
}

export function loginUser(payload: LoginDto): Promise<AuthResponseDto> {
  return apiFetch<AuthResponseDto>("/auth/login", { method: "POST", body: JSON.stringify(payload) });
}

export function getMe(): Promise<UserMeResponseDto> {
  return authFetch<UserMeResponseDto>("/auth/me");
}
