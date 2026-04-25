import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { TransactionsModule } from './transactions/transactions.module';
import { HealthModule } from './health/health.module';
import { blockchainConfig } from './config/blockchain.config';

@Module({
  imports: [
    // Configuración global con validación tipada de env vars
    ConfigModule.forRoot({
      isGlobal: true,
      load: [blockchainConfig],
    }),

    // Módulos del microservicio
    PrismaModule,
    TransactionsModule,
    HealthModule,
  ],
})
export class AppModule {}
