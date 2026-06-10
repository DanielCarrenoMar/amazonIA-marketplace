import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { IngestModule } from './ingest/ingest.module';
import { MessagingModule } from 'messaging';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 200,
      },
    ]),
    HealthModule,
    IngestModule,
    MessagingModule.forRoot(),
  ],
})
export class AppModule {}
