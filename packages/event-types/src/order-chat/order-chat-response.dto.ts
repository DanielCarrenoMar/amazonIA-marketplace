import { UserRole } from '../enums';

export class OrderChatSenderDto {
  id: string;
  fullName: string;
  role: UserRole;
}

export class OrderChatResponseDto {
  id: number;
  orderId: string;
  senderId: string;
  message: string;
  sentAt: Date;
  sender?: OrderChatSenderDto;
}
