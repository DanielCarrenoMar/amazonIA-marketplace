// =============================================================================
// Blockchain Config — Validación tipada de variables de entorno
// =============================================================================

export interface BlockchainConfig {
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
  apiKey: string;
  networkName: string;
  maxRetryAttempts: number;
}

export const BLOCKCHAIN_CONFIG_KEY = 'blockchain';

export const blockchainConfig = (): { blockchain: BlockchainConfig } => {
  const rpcUrl = process.env.RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const apiKey = process.env.API_KEY;

  if (!rpcUrl) throw new Error('RPC_URL is required');
  if (!privateKey) throw new Error('PRIVATE_KEY is required');
  if (!contractAddress) throw new Error('CONTRACT_ADDRESS is required');
  if (!apiKey) throw new Error('API_KEY is required');

  return {
    blockchain: {
      rpcUrl,
      privateKey,
      contractAddress,
      apiKey,
      networkName: process.env.NETWORK_NAME || 'arbitrum',
      maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
    },
  };
};
