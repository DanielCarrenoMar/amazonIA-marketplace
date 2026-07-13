import { Controller, Get, Post, Body, Query, Headers } from '@nestjs/common';
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

  @Post('evaluate')
  async evaluateRisk(
    @Body() payload: any,
    @Headers('authorization') authHeader: string
  ) {
    const token = authHeader?.split(' ')[1] || '';
    return this.inferenceService.evaluateRisk(payload, token);
  }
}
