import { Module } from '@nestjs/common';
import { OutboxModule } from '../outbox/outbox.module';
import { TelemetryIntegrationModule } from '../telemetry-integration/telemetry-integration.module';
import { ProductOrderController } from './product-order.controller';
import { ProductOrderService } from './product-order.service';

@Module({
  imports: [OutboxModule, TelemetryIntegrationModule],
  controllers: [ProductOrderController],
  providers: [ProductOrderService],
})
export class ProductOrderModule {}
