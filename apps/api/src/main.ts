try {
  const dotenv = require('dotenv');
  const path = require('path');
  // In local dev: load root_dir/.env
  dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
  dotenv.config(); // Fallback to load .env in apps/api/ if it exists
} catch {}
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // Validate strict required environment variables early to avoid unsafe startup
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`Missing required environment variable: ${key}`);
      process.exit(1);
    }
  }

  // Optional variables with defaults or specific feature requirements:
  // - FRONTEND_URL: defaults to http://localhost:3000
  // - SUPABASE_URL / SUPABASE_SERVICE_KEY: required only for image uploads

  const app = await NestFactory.create(AppModule);

  // Setup Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('AmazonIA Marketplace API')
    .setDescription('Interactive documentation for AmazonIA 4.0 system endpoints')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Activate all class-validator decorators globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Strips unknown fields from request body
      forbidNonWhitelisted: true, // Throws 400 if unknown fields are sent
      transform: true,            // Auto-transforms payloads to DTO class instances
    }),
  );

  // HTTP security headers — must run before CORS so security headers are present
  // on ALL responses, including CORS-rejected preflight requests.
  // HSTS is only enabled in production to avoid locking browsers into HTTPS-only
  // mode in HTTP dev/staging environments (would be cached for 180 days).
  app.use(
    helmet({
      hsts: process.env.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true }
        : false,
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

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`[NestApplication] Server is listening on port: ${port}`);
}
bootstrap();
