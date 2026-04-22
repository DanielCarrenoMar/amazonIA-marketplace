import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { Web3Service } from './web3.service';

@Module({
  controllers: [TransactionsController],
  providers: [Web3Service],
})
export class TransactionsModule {}
