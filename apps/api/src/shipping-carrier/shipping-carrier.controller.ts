import { Controller, Get, UseGuards } from '@nestjs/common';
import { ShippingCarrierService } from './shipping-carrier.service';
import { ShippingCarrierResponseDto } from 'event-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('shipping-carriers')
export class ShippingCarrierController {
  constructor(private readonly shippingCarrierService: ShippingCarrierService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(): Promise<ShippingCarrierResponseDto[]> {
    return this.shippingCarrierService.findAll();
  }
}
