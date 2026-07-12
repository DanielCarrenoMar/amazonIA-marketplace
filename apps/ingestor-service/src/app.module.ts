import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RpcThrottlerGuard } from './common/guards/rpc-throttler.guard';
import { HealthModule } from './health/health.module';
import { IngestModule } from './ingest/ingest.module';
import { MessagingModule } from 'messaging';

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
  providers: [
    {
      provide: APP_GUARD,
      useClass: RpcThrottlerGuard,
    },
  ],
})
export class AppModule {}
