import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { WebhookModule } from '../webhook/webhook.module';

@Module({
  imports: [BlockchainModule, WebhookModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
