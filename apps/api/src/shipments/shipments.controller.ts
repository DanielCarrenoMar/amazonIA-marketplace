import { Controller, Get, Param, Query, UseGuards, ValidationPipe, Req } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { PaginationDto } from 'event-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':tracking_number/history')
  getHistory(
    @Param('tracking_number') trackingNumber: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: PaginationDto,
    @Req() req: any,
  ) {
    return this.shipmentsService.getHistory(trackingNumber, query, req.user);
  }
  @UseGuards(JwtAuthGuard)
  @Get('sensor/:sensor_id/history')
  getHistoryBySensor(
    @Param('sensor_id') sensorId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: PaginationDto,
    @Req() req: any,
  ) {
    return this.shipmentsService.getHistoryBySensor(sensorId, query, req.user);
  }
}
