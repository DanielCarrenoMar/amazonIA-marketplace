import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateOrderChatDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
