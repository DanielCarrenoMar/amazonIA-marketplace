import { DynamicModule, Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongoTelemetryModule } from './mongo-telemetry.module';

/**
 * MongoModule — opcional por diseño.
 * Si MONGODB_URI no está configurado, no registra ninguna conexión Mongoose
 * y exporta un módulo vacío. Chat y telemetría no estarán disponibles,
 * pero el resto de la API funciona normalmente.
 */
@Module({})
export class MongoModule {
  static forRoot(): DynamicModule {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      new Logger('MongoModule').warn(
        'MONGODB_URI not set — MongoDB disabled. Chat and telemetry features unavailable.',
      );
      return {
        module: MongoModule,
        global: true,
        imports: [],
        exports: [],
      };
    }

    return {
      module: MongoModule,
      global: true,
      imports: [
        ConfigModule,
        MongooseModule.forRootAsync({
          useFactory: (config: ConfigService) => ({
            uri: config.get<string>('MONGODB_URI')!,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 2,
            maxIdleTimeMS: 30000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            retryReads: true,
          }),
          inject: [ConfigService],
        }),
        MongoTelemetryModule,
      ],
      exports: [MongooseModule, MongoTelemetryModule],
    };
  }
}
