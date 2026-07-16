import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  // Only import MongooseModule when MongoDB is actually configured;
  // otherwise @Optional() @InjectConnection() resolves to undefined.
  imports: process.env.MONGODB_URI ? [MongooseModule] : [],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
