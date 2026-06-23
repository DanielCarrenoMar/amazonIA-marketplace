import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongoTelemetryModule } from './mongo-telemetry.module';

@Module({
  imports: [
    // We import ConfigModule so ConfigService is available
    ConfigModule,
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
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
})
export class MongoModule {}
