// ---------------------------------------------------------------------------
// Blockchain Enums
// ---------------------------------------------------------------------------

export enum BlockchainStatusEnum {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

// ---------------------------------------------------------------------------
// Notarization Payload — Backend → Notario
// ---------------------------------------------------------------------------

export interface NotarizeOrderPayload {
  orderId: string;
  amount: number;
  paymentMethod: string;
  productHash: string;
  buyerId: string;
  sellerId: string;
  webhookUrl: string;
}

// ---------------------------------------------------------------------------
// Webhook Callback Payload — Notario → Backend
// ---------------------------------------------------------------------------

export interface WebhookCallbackPayload {
  orderId: string;
  transactionHash: string | null;
  blockNumber: number | null;
  status: BlockchainStatusEnum;
  gasUsed: string | null;
  errorMessage: string | null;
  timestamp: string;
  // Nuevos campos para NFT (infraestructura)
  nftTokenId?: string | null;
  nftTxHash?: string | null;
}

// ---------------------------------------------------------------------------
// Notarization Response — Notario → Backend (respuesta inmediata 202)
// ---------------------------------------------------------------------------

export interface NotarizeAcceptedResponse {
  accepted: boolean;
  orderId: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Health Check Response
// ---------------------------------------------------------------------------

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  rpcConnected: boolean;
  walletBalance: string | null;
  contractAddress: string;
  networkName: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Enums de Gobernanza
// ---------------------------------------------------------------------------

export enum GovernanceRoleEnum {
  NONE = 'NONE',
  MEMBER = 'MEMBER',
  ELDER = 'ELDER',
}

export enum ProposalStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  VETOED = 'VETOED',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

