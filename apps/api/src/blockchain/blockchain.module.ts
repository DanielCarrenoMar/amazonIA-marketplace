import { Module } from '@nestjs/common';
import { BlockchainWebhookController } from './blockchain-webhook.controller';
import { BlockchainExplorerController } from './blockchain-explorer.controller';
import { NotaryClientService } from './services/notary-client.service';
import { BlockchainRecordService } from './services/blockchain-record.service';
import { BlockchainExplorerService } from './services/blockchain-explorer.service';
import { BlockchainReconciliationService } from './services/blockchain-reconciliation.service';

@Module({
  controllers: [BlockchainWebhookController, BlockchainExplorerController],
  providers: [
    NotaryClientService,
    BlockchainRecordService,
    BlockchainExplorerService,
    BlockchainReconciliationService,
  ],
  exports: [
    NotaryClientService,
    BlockchainRecordService,
    BlockchainExplorerService,
  ],
})
export class BlockchainModule {}
