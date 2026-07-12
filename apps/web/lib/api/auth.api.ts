import type { AuthResponseDto, CreateUserAccountDto, LoginDto, UserMeResponseDto, UpdateUserAccountDto, ChangePasswordDto, UserAccountResponseDto } from 'event-types';
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

export function updateMe(id: string, payload: UpdateUserAccountDto): Promise<UserAccountResponseDto> {
  return authFetch<UserAccountResponseDto>(`/user-account/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function changeMyPassword(id: string, payload: ChangePasswordDto): Promise<UserAccountResponseDto> {
  return authFetch<UserAccountResponseDto>(`/user-account/${id}/password`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function uploadAvatar(id: string, file: File): Promise<UserAccountResponseDto> {
  const formData = new FormData();
  formData.append("file", file);

  return authFetch<UserAccountResponseDto>(`/user-account/${id}/avatar`, {
    method: "POST",
    body: formData,
    // Do not set Content-Type header manually here; let the browser set it with the boundary automatically for FormData
  });
}
