import { Controller, Get, Param, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { PaginationDto } from 'event-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  //@UseGuards(JwtAuthGuard)
  @Get(':tracking_number/history')
  getHistory(
    @Param('tracking_number') trackingNumber: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: PaginationDto,
  ) {
    return this.shipmentsService.getHistory(trackingNumber, query);
  }
}
