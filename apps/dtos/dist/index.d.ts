export declare enum BlockchainStatusEnum {
    PENDING = "PENDING",
    SUBMITTED = "SUBMITTED",
    CONFIRMED = "CONFIRMED",
    FAILED = "FAILED"
}
export interface NotarizeOrderPayload {
    orderId: string;
    amount: number;
    paymentMethod: string;
    productHash: string;
    buyerId: string;
    sellerId: string;
    webhookUrl: string;
}
export interface WebhookCallbackPayload {
    orderId: string;
    transactionHash: string | null;
    blockNumber: number | null;
    status: BlockchainStatusEnum;
    gasUsed: string | null;
    errorMessage: string | null;
    timestamp: string;
}
export interface NotarizeAcceptedResponse {
    accepted: boolean;
    orderId: string;
    message: string;
}
export interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    rpcConnected: boolean;
    walletBalance: string | null;
    contractAddress: string;
    networkName: string;
    timestamp: string;
}
//# sourceMappingURL=index.d.ts.map