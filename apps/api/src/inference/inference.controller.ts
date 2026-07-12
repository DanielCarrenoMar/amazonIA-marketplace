import { Controller, Get, Query } from '@nestjs/common';
import { InferenceService } from './inference.service';

@Controller('inference')
export class InferenceController {
  constructor(private readonly inferenceService: InferenceService) {}

  @Get('spatial-risk')
  async getSpatialRisk(
    @Query('lat') lat: number,
    @Query('lon') lon: number,
    @Query('transportType') transportType?: string,
    @Query('productType') productType?: string,
  ) {
    return this.inferenceService.getSpatialRisk(lat, lon, transportType, productType);
  }
}
