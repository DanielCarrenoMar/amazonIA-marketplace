try { require('dotenv/config'); } catch { }
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

import { LogRpcExceptionFilter } from './common/filters/rpc-exception.filter';

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

  // 1. Crear la app HTTP (necesaria para que Render detecte un puerto abierto)
  const app = await NestFactory.create(AppModule);

  // 1.5 Añadir el microservicio de MQTT (HiveMQ Cloud con TLS)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      host: process.env.HIVEMQ_HOST,
      port: process.env.HIVEMQ_PORT ? parseInt(process.env.HIVEMQ_PORT, 10) : 8883,
      protocol: 'mqtts', // Obligatorio TLS en HiveMQ Cloud
      username: process.env.HIVEMQ_USERNAME,
      password: process.env.HIVEMQ_PASSWORD,
      clean: true,
    },
  });

  // Validar incoming DTOs globalmente en los mensajes del microservicio
  // NOTA: whitelist/forbidNonWhitelisted desactivados intencionalmente para que
  // los payloads MQTT del simulador (que pueden tener campos extra) no sean rechazados.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new LogRpcExceptionFilter()
  );

  // 2. Iniciar el microservicio y el servidor HTTP
  await app.startAllMicroservices();
  const port = process.env.PORT || 3002;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 HTTP Server running on port ${port} (Render healthcheck)`);
  logger.log('📡 MQTT Microservice listener started successfully');
}
bootstrap();
