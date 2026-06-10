// =============================================================================
// NotaryClientService — HTTP Client para comunicarse con el Microservicio Notario
// Patrón: Strategy — abstrae la comunicación con el notario
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BlockchainStatus } from '@prisma/client';
import type { NotarizeOrderPayload } from 'event-types';

@Injectable()
export class NotaryClientService {
  private readonly logger = new Logger(NotaryClientService.name);
  private readonly notaryBaseUrl: string;
  private readonly notaryApiKey: string;
  private readonly webhookBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
  ) {
    this.notaryBaseUrl = process.env.NOTARY_SERVICE_URL || 'http://localhost:3001/api/v1';
    this.notaryApiKey = process.env.NOTARY_API_KEY || '';
    this.webhookBaseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3000/api';
  }

  /**
   * Envía una solicitud de notarización al microservicio notario.
   *
   * Flujo:
   * 1. Crea un BlockchainRecord con status PENDING
   * 2. Envía POST al notario con webhook_url
   * 3. El notario procesa async y notifica via webhook
   */
  async notarizeOrder(params: NotarizeOrderPayload): Promise<void> {
    const { orderId } = params;

    try {
      // 1. Crear registro de seguimiento en la DB
      await this.prisma.blockchainRecord.upsert({
        where: { orderId },
        update: {
          status: BlockchainStatus.PENDING,
          errorMessage: null,
        },
        create: {
          orderId,
          status: BlockchainStatus.PENDING,
        },
      });

      // 2. Construir el payload con la URL del webhook
      const webhookUrl = `${this.webhookBaseUrl}/blockchain/webhook`;

      const payload = {
        orderId: params.orderId,
        amount: params.amount,
        paymentMethod: params.paymentMethod,
        productHash: params.productHash,
        buyerId: params.buyerId,
        sellerId: params.sellerId,
        webhookUrl,
      };

      // 3. Enviar al microservicio notario
      this.logger.log(`Sending notarization request for order: ${orderId}`);

      const response = await fetch(`${this.notaryBaseUrl}/transactions/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.notaryApiKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Notary returned ${response.status}: ${errorBody}`);
      }

      this.logger.log(`Notarization request accepted for order: ${orderId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send notarization request for order ${orderId}: ${error.message}`);

      // Actualizar el registro como fallido
      await this.prisma.blockchainRecord.update({
        where: { orderId },
        data: {
          status: BlockchainStatus.FAILED,
          errorMessage: `Communication error: ${error.message}`,
        },
      });

      // No relanzamos el error — la compra FIAT ya se procesó correctamente
      // La notarización es un proceso secundario que no debe bloquear la orden
    }
  }
}
