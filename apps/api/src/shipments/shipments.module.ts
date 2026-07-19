import { Module } from '@nestjs/common';
import { TelemetryIntegrationModule } from '../telemetry-integration/telemetry-integration.module';
import { ShipmentsController } from './shipments.controller';
import { ActiveSensorsController } from './active-sensors.controller';
import { ShipmentsService } from './shipments.service';

@Module({
  imports: [TelemetryIntegrationModule.forRoot()],
  controllers: [ShipmentsController, ActiveSensorsController],
  providers: [ShipmentsService],
})
export class ShipmentsModule {}
