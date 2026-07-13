import { Module } from '@nestjs/common';
import { OutboxModule } from '../outbox/outbox.module';
import { TelemetryIntegrationModule } from '../telemetry-integration/telemetry-integration.module';
import { ProductOrderController } from './product-order.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { NotificationModule } from '../notification/notification.module';
import { ProductOrderService } from './product-order.service';

@Module({
  imports: [OutboxModule, TelemetryIntegrationModule, BlockchainModule, NotificationModule],
  controllers: [ProductOrderController],
  providers: [ProductOrderService],
})
export class ProductOrderModule {}
