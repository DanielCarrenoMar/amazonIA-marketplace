import { Module } from '@nestjs/common';
import { OutboxModule } from '../outbox/outbox.module';
import { TelemetryIntegrationModule } from '../telemetry-integration/telemetry-integration.module';
import { ProductOrderController } from './product-order.controller';
import { NotificationModule } from '../notification/notification.module';
import { ProductOrderService } from './product-order.service';

@Module({
  imports: [OutboxModule, TelemetryIntegrationModule.forRoot(), NotificationModule],
  controllers: [ProductOrderController],
  providers: [ProductOrderService],
})
export class ProductOrderModule {}
