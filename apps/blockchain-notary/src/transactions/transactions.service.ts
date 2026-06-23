import { Injectable, Logger } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { WebhookService } from '../webhook/webhook.service';
import { PrismaService } from '../prisma/prisma.service';
import { GovernanceService } from '../governance/governance.service';
import type { NotarizeOrderPayload } from 'event-types';
import { BlockchainStatus } from '@prisma/client';

const MAX_RETRY_ATTEMPTS = 3;

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly webhookService: WebhookService,
    private readonly prisma: PrismaService,
    private readonly governanceService: GovernanceService,
  ) {}

  /**
   * Procesa la notarización de forma asíncrona mediante gobernanza.
   * Este método NO se espera (fire-and-forget desde el controller).
   *
   * Flujo:
   * 1. Crea registro en DB con status PENDING y guarda webhookUrl
   * 2. Crea propuesta de gobernanza en DB + On-chain
   * 3. Espera a la votación de la comunidad y finalización por Elder
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
          webhookUrl,
        },
        create: {
          orderId,
          status: BlockchainStatus.PENDING,
          networkName: this.blockchainService['config'].networkName,
          webhookUrl,
        },
      });

      this.logger.log(`Processing notarization as governance proposal for order: ${orderId}`);

      // 2. Crear propuesta con deadline de 24 horas (1440 minutos)
      await this.governanceService.createProposal(
        orderId,
        payload.productHash,
        payload.sellerId, // Vendedor es el proponente
        1440,
      );

      this.logger.log(
        `Governance proposal created for order ${orderId}. Waiting for community voting.`,
      );
    } catch (error: any) {
      this.logger.error(`Notarization proposal creation failed for order ${orderId}: ${error.message}`);

      // Actualizar DB con el error
      await this.prisma.blockchainRecord.update({
        where: { orderId },
        data: {
          status: BlockchainStatus.FAILED,
          errorMessage: `Governance Proposal creation failed: ${error.message}`,
        },
      });

      // Notificar al backend del fallo via webhook
      if (webhookUrl) {
        const webhookPayload = this.webhookService.buildFailurePayload(
          orderId,
          `Governance Proposal creation failed: ${error.message}`,
        );
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

    return failedRecords.length;
  }
}

