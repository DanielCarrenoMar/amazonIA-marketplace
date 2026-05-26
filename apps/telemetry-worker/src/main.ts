import 'dotenv/config';
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

  if (!process.env.KAFKA_REST_URL || !process.env.KAFKA_REST_TOKEN) {
    logger.warn(
      'KAFKA_REST_URL or KAFKA_REST_TOKEN not set. Kafka consumption will fail at runtime.',
    );
  }

  const app = await NestFactory.create(AppModule);

  // Only expose health endpoint — no public API
  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  logger.log(`Telemetry Worker running on port ${port} (health check only)`);
  logger.log(
    `Polling Kafka every ${process.env.POLL_INTERVAL_MS ?? 5000}ms`,
  );
}
bootstrap();
