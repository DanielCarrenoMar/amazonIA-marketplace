import { Module } from '@nestjs/common';
import { BlockchainWebhookController } from './blockchain-webhook.controller';
import { NotaryClientService } from './services/notary-client.service';
import { BlockchainRecordService } from './services/blockchain-record.service';

@Module({
  controllers: [BlockchainWebhookController],
  providers: [NotaryClientService, BlockchainRecordService],
  exports: [NotaryClientService, BlockchainRecordService],
})
export class BlockchainModule {}
