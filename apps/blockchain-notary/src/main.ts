import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ¡CLAVE! Activamos class-validator de manera global para que el DTO valide al instante el payload
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  // Endpoint de negocio
  app.setGlobalPrefix('api/v1');
  
  await app.listen(process.env.PORT || 3001);
}
bootstrap();
