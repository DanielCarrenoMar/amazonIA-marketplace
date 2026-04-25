// =============================================================================
// WebhookService — Notifica al Backend Core los resultados de la notarización
// Patrón: Observer — el backend se suscribe via webhook_url
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { BlockchainStatusEnum, WebhookCallbackPayload } from './dto/webhook-callback.dto';

const MAX_WEBHOOK_RETRIES = 3;
const WEBHOOK_RETRY_DELAY_MS = 2000;

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  /**
   * Notifica al backend el resultado de la notarización.
   * Incluye reintentos con backoff lineal.
   */
  async notifyBackend(webhookUrl: string, payload: WebhookCallbackPayload): Promise<boolean> {
    for (let attempt = 1; attempt <= MAX_WEBHOOK_RETRIES; attempt++) {
      try {
        this.logger.log(
          `Sending webhook callback for order ${payload.orderId} (attempt ${attempt}/${MAX_WEBHOOK_RETRIES})`,
        );

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (response.ok) {
          this.logger.log(`Webhook delivered successfully for order ${payload.orderId}`);
          return true;
        }

        this.logger.warn(
          `Webhook returned ${response.status} for order ${payload.orderId}`,
        );
      } catch (error) {
        this.logger.error(
          `Webhook attempt ${attempt} failed for order ${payload.orderId}: ${error.message}`,
        );
      }

      // Esperar antes del siguiente reintento (backoff lineal)
      if (attempt < MAX_WEBHOOK_RETRIES) {
        await this.delay(WEBHOOK_RETRY_DELAY_MS * attempt);
      }
    }

    this.logger.error(
      `All webhook attempts exhausted for order ${payload.orderId}`,
    );
    return false;
  }

  /**
   * Construye el payload de éxito para el webhook callback.
   */
  buildSuccessPayload(
    orderId: string,
    transactionHash: string,
    blockNumber: number,
    gasUsed: string,
  ): WebhookCallbackPayload {
    return {
      orderId,
      transactionHash,
      blockNumber,
      status: BlockchainStatusEnum.CONFIRMED,
      gasUsed,
      errorMessage: null,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Construye el payload de error para el webhook callback.
   */
  buildFailurePayload(orderId: string, errorMessage: string): WebhookCallbackPayload {
    return {
      orderId,
      transactionHash: null,
      blockNumber: null,
      status: BlockchainStatusEnum.FAILED,
      gasUsed: null,
      errorMessage,
      timestamp: new Date().toISOString(),
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
