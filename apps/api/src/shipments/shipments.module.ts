import { Module } from '@nestjs/common';
import { TelemetryIntegrationModule } from '../telemetry-integration/telemetry-integration.module';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';

@Module({
  imports: [TelemetryIntegrationModule.forRoot()],
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
})
export class ShipmentsModule {}
