import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { Transport, MicroserviceOptions } from "@nestjs/microservices";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LogRpcExceptionFilter } from "./common/filters/rpc-exception.filter";

async function bootstrap() {
  const logger = new Logger("IngestorService");

  // Validar variables de entorno requeridas
  const required = [
    "INGESTOR_API_KEY",
    "HIVEMQ_HOST",
    "HIVEMQ_USERNAME",
    "HIVEMQ_PASSWORD",
  ];
  for (const key of required) {
    if (!process.env[key]) {
      logger.error(`Missing required environment variable: ${key}`);
      process.exit(1);
    }
  }

  // 1. Crear aplicación HTTP (necesario para el Healthcheck de Docker/K8s)
  const app = await NestFactory.create(AppModule);

  // Seguridad básica para los endpoints HTTP expuestos (ej. /health)
  app.use(helmet());

  // 2. Conectar el microservicio MQTT a la misma aplicación (Arquitectura Híbrida)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      host: process.env.HIVEMQ_HOST,
      port: process.env.HIVEMQ_PORT
        ? parseInt(process.env.HIVEMQ_PORT, 10)
        : 8883,
      protocol: "mqtts", // Obligatorio TLS en HiveMQ Cloud
      username: process.env.HIVEMQ_USERNAME,
      password: process.env.HIVEMQ_PASSWORD,
    },
  });

  // Validar incoming DTOs globalmente (Aplica tanto a HTTP como MQTT)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Registrar manejadores de errores globales
  app.useGlobalFilters(new LogRpcExceptionFilter());
  app.useGlobalFilters(new HttpExceptionFilter());

  // 3. Iniciar todos los microservicios acoplados (empieza a escuchar en MQTT)
  await app.startAllMicroservices();
  logger.log("📡 MQTT Microservice listener connected successfully");

  // 4. Levantar servidor HTTP en el puerto configurado (atiende healthchecks)
  const port = process.env.PORT || 3002;
  await app.listen(port);
  logger.log(`🚀 HTTP Health/API Server running on port ${port}`);
}
bootstrap();
