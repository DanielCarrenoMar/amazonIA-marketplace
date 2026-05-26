import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('IngestorService');

  // Validate required environment variables early
  const required = ['INGESTOR_API_KEY'];
  for (const key of required) {
    if (!process.env[key]) {
      logger.error(`Missing required environment variable: ${key}`);
      process.exit(1);
    }
  }

  // Kafka credentials are optional at startup (allows running without Kafka for dev)
  if (!process.env.KAFKA_REST_URL || !process.env.KAFKA_REST_TOKEN) {
    logger.warn(
      'KAFKA_REST_URL or KAFKA_REST_TOKEN not set. Kafka publishing will fail at runtime.',
    );
  }

  const app = await NestFactory.create(AppModule);

  // Validate incoming DTOs globally via class-validator decorators
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Security headers
  app.use(
    helmet({
      hsts:
        process.env.NODE_ENV === 'production'
          ? { maxAge: 31536000, includeSubDomains: true }
          : false,
    }),
  );

  // CORS — IoT devices and simulators may call from anywhere
  app.enableCors({ origin: '*' });

  // Standardized error responses
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  logger.log(`Ingestor Service running on port ${port}`);
}
bootstrap();
