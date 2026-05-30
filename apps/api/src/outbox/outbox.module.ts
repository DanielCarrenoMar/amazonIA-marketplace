import { Module } from '@nestjs/common';
import { OutboxRelayService } from './outbox-relay.service';
import { OutboxService } from './outbox.service';

@Module({
  providers: [OutboxService, OutboxRelayService],
  exports: [OutboxService],
})
export class OutboxModule {}
