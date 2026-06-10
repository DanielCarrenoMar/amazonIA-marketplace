import { Module } from '@nestjs/common';
import { ShippingCarrierController } from './shipping-carrier.controller';
import { ShippingCarrierService } from './shipping-carrier.service';

@Module({
  controllers: [ShippingCarrierController],
  providers: [ShippingCarrierService],
})
export class ShippingCarrierModule {}
