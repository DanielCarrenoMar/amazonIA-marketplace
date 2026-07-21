import { Module } from '@nestjs/common';
import { TelemetryIntegrationModule } from './telemetry-integration.module';
import { TelemetryIntegrationController } from './telemetry-integration.controller';

// Expone la telemetría vía HTTP. Separado de TelemetryIntegrationModule
// porque ese se importa vía forRoot() desde varios módulos de dominio —
// este, en cambio, se importa una sola vez desde AppModule.
@Module({
  imports: [TelemetryIntegrationModule.forRoot()],
  controllers: [TelemetryIntegrationController],
})
export class TelemetryModule {}
