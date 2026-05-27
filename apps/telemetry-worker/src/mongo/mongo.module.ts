import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { MongoTelemetryModule } from 'database';

@Module({
  imports: [
    // Connect to MongoDB Atlas using the URI from environment
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // Register Mongoose schemas for both time-series collections
    MongoTelemetryModule,
  ],
  exports: [MongooseModule, MongoTelemetryModule],
})
export class MongoModule {}
