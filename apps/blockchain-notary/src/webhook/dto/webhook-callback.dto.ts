// =============================================================================
// Webhook Callback DTO — Estructura de la respuesta enviada al Backend
// =============================================================================

export enum BlockchainStatusEnum {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

export class WebhookCallbackPayload {
  orderId: string;
  transactionHash: string | null;
  blockNumber: number | null;
  status: BlockchainStatusEnum;
  gasUsed: string | null;
  errorMessage: string | null;
  timestamp: string;
}
