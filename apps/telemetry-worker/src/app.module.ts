import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './health/health.module';
import { MongoModule } from './mongo/mongo.module';
import { WorkerModule } from './worker/worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), // Enables @Interval() and @Cron() decorators
    MongoModule,
    HealthModule,
    WorkerModule,
  ],
})
export class AppModule {}
