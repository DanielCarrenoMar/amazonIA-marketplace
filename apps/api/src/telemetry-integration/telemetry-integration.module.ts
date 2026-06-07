import { Module } from '@nestjs/common';
import { MongoTelemetryModule } from 'database';
import { TelemetryIntegrationService } from './telemetry-integration.service';

@Module({
  imports: [MongoTelemetryModule],
  providers: [TelemetryIntegrationService],
  exports: [TelemetryIntegrationService],
})
export class TelemetryIntegrationModule {}
