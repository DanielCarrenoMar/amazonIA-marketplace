import { Module } from '@nestjs/common';
import { OutboxModule } from '../outbox/outbox.module';
import { ProductOrderController } from './product-order.controller';
import { ProductOrderService } from './product-order.service';

@Module({
  imports: [OutboxModule],
  controllers: [ProductOrderController],
  providers: [ProductOrderService],
})
export class ProductOrderModule {}
