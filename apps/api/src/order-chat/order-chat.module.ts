import { Module } from '@nestjs/common';
import { OrderChatController } from './order-chat.controller';
import { OrderChatService } from './order-chat.service';

@Module({
  controllers: [OrderChatController],
  providers: [OrderChatService],
})
export class OrderChatModule {}
