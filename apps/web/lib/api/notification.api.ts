import { authFetch } from './client';
import type { NotificationResponseDto, FindNotificationsDto } from 'event-types';

export async function fetchNotifications(params?: FindNotificationsDto): Promise<{ items: NotificationResponseDto[], total: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  
  const qString = query.toString() ? `?${query.toString()}` : '';
  return authFetch(`/notifications${qString}`);
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  return authFetch('/notifications/read-all', {
    method: 'PATCH',
  });
}

export async function markNotificationAsRead(id: number): Promise<{ success: boolean }> {
  return authFetch(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}
