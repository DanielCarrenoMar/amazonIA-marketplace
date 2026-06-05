import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('IngestorService');

  // Validar variables de entorno requeridas
  const required = ['INGESTOR_API_KEY', 'HIVEMQ_HOST', 'HIVEMQ_USERNAME', 'HIVEMQ_PASSWORD'];
  for (const key of required) {
    if (!process.env[key]) {
      logger.error(`Missing required environment variable: ${key}`);
      process.exit(1);
    }
  }

  // 1. Crear la aplicación HTTP base
  const app = await NestFactory.create(AppModule);

  // 2. Conectar el microservicio de MQTT (HiveMQ Cloud con TLS)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      host: process.env.HIVEMQ_HOST,
      port: process.env.HIVEMQ_PORT ? parseInt(process.env.HIVEMQ_PORT, 10) : 8883,
      protocol: 'mqtts', // Obligatorio TLS en HiveMQ Cloud
      username: process.env.HIVEMQ_USERNAME,
      password: process.env.HIVEMQ_PASSWORD,
    },
  });

  // Validar incoming DTOs globalmente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(
    helmet({
      hsts:
        process.env.NODE_ENV === 'production'
          ? { maxAge: 31536000, includeSubDomains: true }
          : false,
    }),
  );

  app.enableCors({ origin: '*' });
  app.useGlobalFilters(new HttpExceptionFilter());

  // 3. Iniciar todos los microservicios conectados (MQTT)
  await app.startAllMicroservices();
  logger.log('📡 MQTT Microservice listener started successfully');

  // 4. Iniciar el servidor HTTP
  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  logger.log(`🚀 Ingestor HTTP Service running on port ${port}`);
}
bootstrap();
