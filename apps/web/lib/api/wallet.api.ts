import type { UserAccountResponseDto } from 'event-types';
import { authFetch } from './client';

/**
 * Actualiza el walletHash del usuario autenticado.
 * Usa el mismo endpoint PATCH /user-account/:id que ya existe en el backend.
 */
export function updateWalletAddress(
  userId: string,
  walletHash: string,
): Promise<UserAccountResponseDto> {
  return authFetch<UserAccountResponseDto>(`/user-account/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ walletHash }),
  });
}

/**
 * Elimina (limpia) el walletHash del usuario.
 */
export function removeWalletAddress(
  userId: string,
): Promise<UserAccountResponseDto> {
  return authFetch<UserAccountResponseDto>(`/user-account/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ walletHash: null }),
  });
}
