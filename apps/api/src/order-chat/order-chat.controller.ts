import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { OrderChatService } from './order-chat.service';
import { CreateOrderChatDto, OrderChatResponseDto } from 'event-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('order-chat')
@UseGuards(JwtAuthGuard)
export class OrderChatController {
  constructor(private readonly orderChatService: OrderChatService) {}

  @Post()
  create(@Req() req: any, @Body() createDto: CreateOrderChatDto): Promise<OrderChatResponseDto> {
    return this.orderChatService.create(req.user.id, createDto);
  }

  @Get(':orderId')
  findByOrder(@Param('orderId') orderId: string, @Req() req: any): Promise<OrderChatResponseDto[]> {
    return this.orderChatService.findByOrder(orderId, req.user.id, req.user.role);
  }
}
