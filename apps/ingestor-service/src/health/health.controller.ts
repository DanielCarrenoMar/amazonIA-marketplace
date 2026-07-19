import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get(['/', '/health'])
  check() {
    return {
      status: 'ok',
      service: 'ingestor-service',
      timestamp: new Date().toISOString(),
    };
  }
}
