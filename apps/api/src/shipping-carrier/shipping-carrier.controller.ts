import { Controller, Get, UseGuards } from '@nestjs/common';
import { ShippingCarrierService } from './shipping-carrier.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('shipping-carriers')
export class ShippingCarrierController {
  constructor(private readonly shippingCarrierService: ShippingCarrierService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.shippingCarrierService.findAll();
  }
}
