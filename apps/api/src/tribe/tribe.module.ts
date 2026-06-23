import { Module } from '@nestjs/common';
import { TribeService } from './tribe.service';
import { TribeController } from './tribe.controller';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [ProductModule],
  controllers: [TribeController],
  providers: [TribeService],
})
export class TribeModule {}
