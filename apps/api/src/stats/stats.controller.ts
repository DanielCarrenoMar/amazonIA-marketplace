import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('v1/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('impact')
  getImpactStats() {
    return this.statsService.getImpactStats();
  }
}
