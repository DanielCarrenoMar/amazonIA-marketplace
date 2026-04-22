import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    // El ConfigModule nos permite manejar la PRIVATE_KEY y URL de Alchemy desde el .env de forma limpia
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TransactionsModule,
  ],
})
export class AppModule {}
