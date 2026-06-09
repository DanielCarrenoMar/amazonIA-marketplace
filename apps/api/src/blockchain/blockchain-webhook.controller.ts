// =============================================================================
// BlockchainWebhookController — Recibe callbacks del Microservicio Notario
// =============================================================================

import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { BlockchainRecordService } from './services/blockchain-record.service';
import type { WebhookCallbackPayload } from 'dtos';
import { BlockchainStatus } from '@prisma/client';

@Controller('blockchain')
export class BlockchainWebhookController {
  private readonly logger = new Logger(BlockchainWebhookController.name);

  constructor(private readonly blockchainRecordService: BlockchainRecordService) {}

  /**
   * POST /api/blockchain/webhook
   *
   * Endpoint que recibe el callback del microservicio notario
   * cuando una transacción se confirma o falla en la blockchain.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: WebhookCallbackPayload) {
    this.logger.log(
      `Webhook received for order ${payload.orderId}: status=${payload.status}`,
    );

    try {
      // 1. Mapear el status del webhook al enum de Prisma
      const prismaStatus = this.mapStatus(payload.status);

      // 2. Actualizar el BlockchainRecord
      await this.blockchainRecordService.updateFromWebhook(payload.orderId, {
        transactionHash: payload.transactionHash,
        blockNumber: payload.blockNumber,
        status: prismaStatus,
        gasUsed: payload.gasUsed,
        errorMessage: payload.errorMessage,
      });

      // 3. Si fue exitoso, actualizar el transactionHash en la ProductOrder
      if (prismaStatus === BlockchainStatus.CONFIRMED && payload.transactionHash) {
        await this.blockchainRecordService.updateOrderTransactionHash(
          payload.orderId,
          payload.transactionHash,
        );

        this.logger.log(
          `Order ${payload.orderId} notarized successfully. Hash: ${payload.transactionHash}`,
        );
      }

      return { received: true, orderId: payload.orderId };
    } catch (error: any) {
      this.logger.error(
        `Failed to process webhook for order ${payload.orderId}: ${error.message}`,
      );

      // Retornamos 200 de todas formas para evitar reintentos del webhook
      return { received: true, orderId: payload.orderId, error: error.message };
    }
  }

  /**
   * Mapea el status string del webhook al enum de Prisma.
   */
  private mapStatus(status: string): BlockchainStatus {
    const statusMap: Record<string, BlockchainStatus> = {
      PENDING: BlockchainStatus.PENDING,
      SUBMITTED: BlockchainStatus.SUBMITTED,
      CONFIRMED: BlockchainStatus.CONFIRMED,
      FAILED: BlockchainStatus.FAILED,
    };

    return statusMap[status] || BlockchainStatus.FAILED;
  }
}
