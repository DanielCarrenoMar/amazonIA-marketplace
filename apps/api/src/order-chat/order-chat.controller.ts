import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { OrderChatService } from './order-chat.service';
import { CreateOrderChatDto } from 'event-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('order-chat')
@UseGuards(JwtAuthGuard)
export class OrderChatController {
  constructor(private readonly orderChatService: OrderChatService) {}

  @Post()
  create(@Req() req: any, @Body() createDto: CreateOrderChatDto) {
    return this.orderChatService.create(req.user.sub, createDto);
  }

  @Get('order/:orderId')
  findByOrder(@Param('orderId') orderId: string, @Req() req: any) {
    return this.orderChatService.findByOrder(orderId, req.user.sub);
  }
}
