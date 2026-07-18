// =============================================================================
// BlockchainService — Interacción pura con la blockchain usando ethers.js
// Patrón: Repository — encapsula TODO el acceso a la blockchain
// =============================================================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { NOTARY_REGISTRY_ABI } from './contracts/notary-registry.abi';
import { GOVERNANCE_REGISTRY_ABI } from './contracts/governance-registry.abi';
import { ARTISAN_NFT_FACTORY_ABI } from './contracts/artisan-nft-factory.abi';
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
  private contract: ethers.Contract | null = null;
  private governanceContract: ethers.Contract;
  private nftFactoryContract: ethers.Contract;
  private config: BlockchainConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<BlockchainConfig>(BLOCKCHAIN_CONFIG_KEY)!;
  }

  async onModuleInit() {
    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
    if (this.config.contractAddress) {
      this.contract = new ethers.Contract(
        this.config.contractAddress,
        NOTARY_REGISTRY_ABI,
        this.wallet,
      );
    }
    this.governanceContract = new ethers.Contract(
      this.config.governanceContractAddress,
      GOVERNANCE_REGISTRY_ABI,
      this.wallet,
    );
    this.nftFactoryContract = new ethers.Contract(
      this.config.nftFactoryAddress,
      ARTISAN_NFT_FACTORY_ABI,
      this.wallet,
    );

    this.logger.log(`Blockchain service initialized`);
    this.logger.log(`Network: ${this.config.networkName}`);
    this.logger.log(`Contract: ${this.config.contractAddress ?? '(not configured — legacy NotaryRegistry disabled)'}`);
    this.logger.log(`Governance Contract: ${this.config.governanceContractAddress}`);
    this.logger.log(`NFT Factory Contract: ${this.config.nftFactoryAddress}`);
    this.logger.log(`Wallet: ${this.wallet.address}`);
  }

  /**
   * Registra una transacción en el smart contract NotaryRegistry.
   * Esta es la función principal heredada del microservicio.
   */
  async registerTransaction(params: RegisterTransactionParams): Promise<TransactionResult> {
    if (!this.contract) {
      throw new Error('Legacy NotaryRegistry contract is not configured (CONTRACT_ADDRESS not set)');
    }
    this.logger.log(`Sending transaction to blockchain for order: ${params.orderId}`);

    const amountInWei = ethers.parseUnits(params.amount.toString(), 18);

    const tx = await this.contract.registerTransaction(
      params.orderId,
      amountInWei,
      params.paymentMethod,
      params.productHash,
      params.buyerId,
      params.sellerId,
    );

    this.logger.log(`Transaction sent, waiting for confirmation. Hash: ${tx.hash}`);

    const receipt = await tx.wait(1);

    this.logger.log(`Transaction confirmed in block ${receipt.blockNumber}`);

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Asigna un rol (NONE = 0, MEMBER = 1, ELDER = 2) a un miembro en blockchain.
   */
  async assignRole(member: string, userId: string, role: number): Promise<TransactionResult> {
    this.logger.log(`Assigning role ${role} to ${member} (${userId}) on-chain`);
    const tx = await this.governanceContract.assignRole(member, userId, role);
    const receipt = await tx.wait(1);
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Transfiere el rol de Elder a una nueva dirección.
   */
  async transferEldership(newElder: string): Promise<TransactionResult> {
    this.logger.log(`Transferring eldership to ${newElder} on-chain`);
    const tx = await this.governanceContract.transferEldership(newElder);
    const receipt = await tx.wait(1);
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Crea una propuesta en el contrato de gobernanza.
   * deadline es el timestamp unix en segundos.
   */
  async createProposal(
    proposalId: string,
    contentHash: string,
    proposerUserId: string,
    deadline: number,
  ): Promise<TransactionResult> {
    this.logger.log(`Creating proposal ${proposalId} on-chain`);
    const tx = await this.governanceContract.createProposal(
      proposalId,
      contentHash,
      proposerUserId,
      deadline,
    );
    const receipt = await tx.wait(1);
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Registra un voto para una propuesta on-chain.
   */
  async castVote(proposalId: string, voter: string, inFavor: boolean): Promise<TransactionResult> {
    this.logger.log(`Casting vote on proposal ${proposalId} for voter ${voter} on-chain`);
    const tx = await this.governanceContract.vote(proposalId, voter, inFavor);
    const receipt = await tx.wait(1);
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Veta una propuesta on-chain.
   */
  async vetoProposal(proposalId: string, reason: string): Promise<TransactionResult> {
    this.logger.log(`Vetoing proposal ${proposalId} on-chain. Reason: ${reason}`);
    const tx = await this.governanceContract.veto(proposalId, reason);
    const receipt = await tx.wait(1);
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Finaliza una propuesta on-chain.
   */
  async finalizeProposal(proposalId: string): Promise<TransactionResult> {
    this.logger.log(`Finalizing proposal ${proposalId} on-chain`);
    const tx = await this.governanceContract.finalizeProposal(proposalId);
    const receipt = await tx.wait(1);
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Obtiene la propuesta directamente desde el smart contract (view).
   */
  async getProposal(proposalId: string): Promise<any> {
    const result = await this.governanceContract.getProposal(proposalId);
    return {
      proposalId: result[0],
      contentHash: result[1],
      proposerUserId: result[2],
      deadline: Number(result[3]),
      votesFor: Number(result[4]),
      votesAgainst: Number(result[5]),
      vetoed: result[6],
      vetoReason: result[7],
      finalized: result[8],
      exists: result[9],
    };
  }

  /**
   * Lee el rol de una dirección (NONE = 0, MEMBER = 1, ELDER = 2) on-chain.
   */
  async getRole(member: string): Promise<number> {
    const role = await this.governanceContract.getRole(member);
    return Number(role);
  }

  /**
   * Acuña un NFT en la colección del artesano para un producto/pedido específico.
   * Si el artesano no tiene colección, el contrato fábrica creará una automáticamente.
   */
  async mintNFT(
    artisanAddress: string,
    recipientAddress: string,
    orderId: string,
    tokenURI: string,
  ): Promise<TransactionResult & { tokenId: string }> {
    this.logger.log(`Minting NFT for artisan ${artisanAddress} to recipient ${recipientAddress} for order: ${orderId}`);
    
    // Convertir el orderId (UUID string) en un uint256 único usando keccak256
    const tokenId = BigInt(ethers.keccak256(ethers.toUtf8Bytes(orderId)));
    
    const tx = await this.nftFactoryContract.mintNFTForProduct(
      artisanAddress,
      recipientAddress,
      tokenId,
      tokenURI,
    );
    
    this.logger.log(`NFT Minting transaction sent, waiting for confirmation. Hash: ${tx.hash}`);
    const receipt = await tx.wait(1);
    this.logger.log(`NFT Minting transaction confirmed in block ${receipt.blockNumber}`);
    
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      tokenId: tokenId.toString(),
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

