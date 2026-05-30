import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { MongoTelemetryModule } from 'database';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
        serverSelectionTimeoutMS: 5000,
      }),
      inject: [ConfigService],
    }),
    MongoTelemetryModule,
  ],
  exports: [MongooseModule],
})
export class MongoModule {}
