// =============================================================================
// TransactionsService — Orquestación del flujo de notarización
// Patrón: Service Layer — coordina blockchain, DB, y webhook
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { WebhookService } from '../webhook/webhook.service';
import { PrismaService } from '../prisma/prisma.service';
import type { NotarizeOrderPayload } from 'dtos';
import { BlockchainStatus } from '@prisma/client';

const MAX_RETRY_ATTEMPTS = 3;

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly webhookService: WebhookService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Procesa la notarización de forma asíncrona.
   * Este método NO se espera (fire-and-forget desde el controller).
   *
   * Flujo:
   * 1. Crea registro en DB con status PENDING
   * 2. Envía TX a la blockchain
   * 3. Actualiza DB con resultado
   * 4. Notifica al backend via webhook
   */
  async processNotarization(payload: NotarizeOrderPayload): Promise<void> {
    const { orderId, webhookUrl } = payload;

    try {
      // 1. Crear registro en DB con status PENDING
      await this.prisma.blockchainRecord.upsert({
        where: { orderId },
        update: {
          status: BlockchainStatus.PENDING,
          retryCount: { increment: 1 },
          errorMessage: null,
        },
        create: {
          orderId,
          status: BlockchainStatus.PENDING,
          networkName: 'arbitrum',
        },
      });

      // 2. Actualizar a SUBMITTED antes de enviar a la blockchain
      await this.prisma.blockchainRecord.update({
        where: { orderId },
        data: {
          status: BlockchainStatus.SUBMITTED,
          submittedAt: new Date(),
        },
      });

      this.logger.log(`Processing notarization for order: ${orderId}`);

      // 3. Enviar transacción a la blockchain
      const result = await this.blockchainService.registerTransaction({
        orderId: payload.orderId,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        productHash: payload.productHash,
        buyerId: payload.buyerId,
        sellerId: payload.sellerId,
      });

      // 4. Actualizar DB con resultado exitoso
      await this.prisma.blockchainRecord.update({
        where: { orderId },
        data: {
          status: BlockchainStatus.CONFIRMED,
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed,
          confirmedAt: new Date(),
        },
      });

      this.logger.log(
        `Notarization confirmed for order ${orderId}. Hash: ${result.transactionHash}`,
      );

      // 5. Notificar al backend via webhook
      if (webhookUrl) {
        const webhookPayload = this.webhookService.buildSuccessPayload(
          orderId,
          result.transactionHash,
          result.blockNumber,
          result.gasUsed,
        );
        await this.webhookService.notifyBackend(webhookUrl, webhookPayload);
      }
    } catch (error: any) {
      this.logger.error(`Notarization failed for order ${orderId}: ${error.message}`);

      // Actualizar DB con el error
      await this.prisma.blockchainRecord.update({
        where: { orderId },
        data: {
          status: BlockchainStatus.FAILED,
          errorMessage: error.message,
        },
      });

      // Notificar al backend del fallo via webhook
      if (webhookUrl) {
        const webhookPayload = this.webhookService.buildFailurePayload(orderId, error.message);
        await this.webhookService.notifyBackend(webhookUrl, webhookPayload);
      }
    }
  }

  /**
   * Consulta el estado de una notarización.
   */
  async getStatus(orderId: string) {
    return this.prisma.blockchainRecord.findUnique({
      where: { orderId },
    });
  }

  /**
   * Reintenta notarizaciones fallidas (para un job scheduler futuro).
   */
  async retryFailed(): Promise<number> {
    const failedRecords = await this.prisma.blockchainRecord.findMany({
      where: {
        status: BlockchainStatus.FAILED,
        retryCount: { lt: MAX_RETRY_ATTEMPTS },
      },
    });

    this.logger.log(`Found ${failedRecords.length} failed records to retry`);

    // TODO: Implementar reintento con los datos originales de la orden
    // Requiere almacenar el payload original o consultarlo al backend

    return failedRecords.length;
  }
}
