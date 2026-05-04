import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activate all class-validator decorators globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Strips unknown fields from request body
      forbidNonWhitelisted: true, // Throws 400 if unknown fields are sent
      transform: true,            // Auto-transforms payloads to DTO class instances
    }),
  );

  // Allow requests from the frontend.
  // In production set FRONTEND_URL in the environment to restrict origins.
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // Global exception filter — formats all errors as:
  // { statusCode, message, timestamp, path }
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
