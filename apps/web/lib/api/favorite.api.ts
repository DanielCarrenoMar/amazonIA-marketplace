import { authFetch } from './client';
import { ToggleFavoriteDto, UserFavoriteResponseDto } from 'event-types';

export const toggleFavorite = async (dto: ToggleFavoriteDto): Promise<{ isFavorite: boolean }> => {
  return authFetch<{ isFavorite: boolean }>('/favorites/toggle', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
};

export const getFavorites = async (): Promise<UserFavoriteResponseDto[]> => {
  return authFetch<UserFavoriteResponseDto[]>('/favorites');
};

export const getFavoriteIds = async (): Promise<string[]> => {
  return authFetch<string[]>('/favorites/ids');
};
