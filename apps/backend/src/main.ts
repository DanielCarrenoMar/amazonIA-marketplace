import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activate all class-validator decorators globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,      // Strips unknown fields from request body
      forbidNonWhitelisted: true, // Throws error if unknown fields are sent
      transform: true,      // Auto-transforms payloads to DTO class instances
    }),
  );

  // Allow requests from the frontend
  app.enableCors();

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
