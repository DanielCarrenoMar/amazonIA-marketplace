import { authFetch } from './client';
import { CreateOrderChatDto, OrderChatResponseDto } from 'event-types';

export const getOrderChat = async (orderId: string): Promise<OrderChatResponseDto[]> => {
  return authFetch<OrderChatResponseDto[]>(`/order-chat/${orderId}`);
};

export const sendMessage = async (dto: CreateOrderChatDto): Promise<OrderChatResponseDto> => {
  return authFetch<OrderChatResponseDto>('/order-chat', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
};
