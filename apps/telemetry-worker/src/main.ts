try { require('dotenv/config'); } catch {}
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('TelemetryWorker');

  // Validate required environment variables
  const required = ['MONGODB_URI'];
  for (const key of required) {
    if (!process.env[key]) {
      logger.error(`Missing required environment variable: ${key}`);
      process.exit(1);
    }
  }

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error', 'debug'],
  });

  // Only expose health endpoint — no public API
  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  logger.log(`Telemetry Worker running on port ${port} (health check only)`);

}
bootstrap();
