import { DynamicModule, Logger, Module } from '@nestjs/common';
import { MongoTelemetryModule } from 'database';
import { TelemetryIntegrationService } from './telemetry-integration.service';

// NOTA: este módulo se importa vía forRoot() desde varios módulos de dominio
// (shipments, product-order) — nunca le agregues un `controllers: [...]` aquí,
// porque cada import crea una instancia nueva del dynamic module y NestJS
// registraría la misma ruta más de una vez. El controller HTTP de telemetría
// vive en TelemetryModule (telemetry.module.ts), importado una sola vez desde
// AppModule.
const NOOP_TELEMETRY = {
  getShipmentTelemetry: async () => null,
  getShipmentTelemetryBySensor: async () => null,
  getShipmentHistory: async () => null,
  getShipmentHistoryBySensor: async () => null,
  getLatestClimateReadings: async () => null,
  get circuitState() { return 'CLOSED'; },
};

@Module({})
export class TelemetryIntegrationModule {
  /**
   * forRoot() checks for MONGODB_URI at startup:
   * - If set   → registers the real TelemetryIntegrationService backed by MongoDB.
   * - If unset → registers a no-op that always returns null/empty so the rest of
   *              the API (including blockchain) works without a MongoDB connection.
   */
  static forRoot(): DynamicModule {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      new Logger('TelemetryIntegrationModule').warn(
        'MONGODB_URI not set — telemetry disabled, using no-op service.',
      );
      return {
        module: TelemetryIntegrationModule,
        providers: [
          { provide: TelemetryIntegrationService, useValue: NOOP_TELEMETRY },
        ],
        exports: [TelemetryIntegrationService],
      };
    }

    return {
      module: TelemetryIntegrationModule,
      imports: [MongoTelemetryModule],
      providers: [TelemetryIntegrationService],
      exports: [TelemetryIntegrationService],
    };
  }
}
