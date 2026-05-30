import { Module } from '@nestjs/common';
import { MongoTelemetryModule } from 'database';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';

@Module({
  imports: [MongoTelemetryModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
})
export class ShipmentsModule {}
