import { Controller, Get, Query, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import type { IClimateEvent } from 'event-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TelemetryIntegrationService } from './telemetry-integration.service';

@Controller('telemetry')
@UseGuards(JwtAuthGuard)
export class TelemetryIntegrationController {
  constructor(private readonly telemetryIntegration: TelemetryIntegrationService) {}

  /**
   * Última lectura conocida de cada estación climática fija — usado por el
   * mapa de calor regional. Distinto de la telemetría de envíos: estas
   * estaciones no están ligadas a ningún tracking_number.
   */
  @Get('climate/current')
  async getCurrentClimate(
    @Query('maxAgeMinutes') maxAgeMinutes?: string,
  ): Promise<IClimateEvent[]> {
    const readings = await this.telemetryIntegration.getLatestClimateReadings(
      maxAgeMinutes ? Number(maxAgeMinutes) : undefined,
    );

    if (readings === null) {
      throw new ServiceUnavailableException('Servicio de telemetría no disponible temporalmente');
    }

    return readings;
  }
}
