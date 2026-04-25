// =============================================================================
// BlockchainService — Interacción pura con la blockchain usando ethers.js
// Patrón: Repository — encapsula TODO el acceso a la blockchain
// =============================================================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { NOTARY_REGISTRY_ABI } from './contracts/notary-registry.abi';
import { BlockchainConfig, BLOCKCHAIN_CONFIG_KEY } from '../config/blockchain.config';

export interface RegisterTransactionParams {
  orderId: string;
  amount: number;
  paymentMethod: string;
  productHash: string;
  buyerId: string;
  sellerId: string;
}

export interface TransactionResult {
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private config: BlockchainConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<BlockchainConfig>(BLOCKCHAIN_CONFIG_KEY)!;
  }

  async onModuleInit() {
    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
    this.contract = new ethers.Contract(
      this.config.contractAddress,
      NOTARY_REGISTRY_ABI,
      this.wallet,
    );

    this.logger.log(`Blockchain service initialized`);
    this.logger.log(`Network: ${this.config.networkName}`);
    this.logger.log(`Contract: ${this.config.contractAddress}`);
    this.logger.log(`Wallet: ${this.wallet.address}`);
  }

  /**
   * Registra una transacción en el smart contract NotaryRegistry.
   * Esta es la función principal del microservicio.
   */
  async registerTransaction(params: RegisterTransactionParams): Promise<TransactionResult> {
    this.logger.log(`Sending transaction to blockchain for order: ${params.orderId}`);

    // Convertir el monto a wei (unidad mínima)
    const amountInWei = ethers.parseUnits(params.amount.toString(), 18);

    // Enviar la transacción al contrato
    const tx = await this.contract.registerTransaction(
      params.orderId,
      amountInWei,
      params.paymentMethod,
      params.productHash,
      params.buyerId,
      params.sellerId,
    );

    this.logger.log(`Transaction sent, waiting for confirmation. Hash: ${tx.hash}`);

    // Esperar confirmación (1 bloque)
    const receipt = await tx.wait(1);

    this.logger.log(`Transaction confirmed in block ${receipt.blockNumber}`);

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Verifica la conexión con el nodo RPC y el balance de la wallet.
   * Usado por el health check.
   */
  async checkHealth(): Promise<{
    rpcConnected: boolean;
    walletBalance: string;
    blockNumber: number;
  }> {
    try {
      const [blockNumber, balance] = await Promise.all([
        this.provider.getBlockNumber(),
        this.provider.getBalance(this.wallet.address),
      ]);

      return {
        rpcConnected: true,
        walletBalance: ethers.formatEther(balance),
        blockNumber,
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return {
        rpcConnected: false,
        walletBalance: '0',
        blockNumber: 0,
      };
    }
  }
}
