// =============================================================================
// BlockchainService — Interacción pura con la blockchain usando ethers.js
// Patrón: Repository — encapsula TODO el acceso a la blockchain
// =============================================================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, NonceManager } from 'ethers';
import { NOTARY_REGISTRY_ABI } from './contracts/notary-registry.abi';
import { GOVERNANCE_REGISTRY_ABI, ContractRole } from './contracts/governance-registry.abi';
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

export interface OnChainProposal {
  proposalId: string;
  contentHash: string;
  proposerUserId: string;
  votesFor: bigint;
  votesAgainst: bigint;
  createdAt: bigint;
  deadline: bigint;
  status: number;
  exists: boolean;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: NonceManager;
  private contract: ethers.Contract;
  private governanceContract: ethers.Contract;
  private config: BlockchainConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<BlockchainConfig>(BLOCKCHAIN_CONFIG_KEY)!;
  }

  async onModuleInit() {
    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);

    // Usar NonceManager para gestionar nonces automáticamente en transacciones concurrentes
    const rawWallet = new ethers.Wallet(this.config.privateKey, this.provider);
    this.wallet = new NonceManager(rawWallet);

    // Contrato legacy de notarización (se mantiene intacto)
    this.contract = new ethers.Contract(
      this.config.contractAddress,
      NOTARY_REGISTRY_ABI,
      this.wallet,
    );

    // Nuevo contrato de gobernanza comunitaria
    if (this.config.governanceContractAddress) {
      this.governanceContract = new ethers.Contract(
        this.config.governanceContractAddress,
        GOVERNANCE_REGISTRY_ABI,
        this.wallet,
      );
      this.logger.log(`Governance Contract: ${this.config.governanceContractAddress}`);
    }

    this.logger.log(`Blockchain service initialized`);
    this.logger.log(`Network: ${this.config.networkName}`);
    this.logger.log(`Contract: ${this.config.contractAddress}`);
    this.logger.log(`Wallet: ${rawWallet.address}`);
  }

  /**
   * Registra una transacción en el smart contract NotaryRegistry.
   * Esta es la función principal del microservicio (flujo legacy).
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

  // ── Métodos de Gobernanza ─────────────────────────────────────────────────

  /**
   * Crea una propuesta en el contrato GovernanceRegistry.
   */
  async createProposal(
    proposalId: string,
    contentHash: string,
    proposerUserId: string,
    deadline: Date,
  ): Promise<TransactionResult> {
    this.logger.log(`Creating governance proposal on-chain: ${proposalId}`);
    const deadlineUnix = Math.floor(deadline.getTime() / 1000);
    const tx = await this.governanceContract.createProposal(
      proposalId,
      contentHash,
      proposerUserId,
      deadlineUnix,
    );
    const receipt = await tx.wait(1);
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Emite un voto en el contrato GovernanceRegistry.
   * La billetera corporativa firma el voto en nombre del servicio (Elder).
   * Retorna el evento ProposalApproved si el quórum fue alcanzado.
   */
  async vote(proposalId: string, inFavor: boolean): Promise<TransactionResult & { approved: boolean }> {
    this.logger.log(`Voting on proposal ${proposalId}: ${inFavor ? 'in favor' : 'against'}`);
    const tx = await this.governanceContract.vote(proposalId, inFavor);
    const receipt = await tx.wait(1);

    // Verificar si el evento ProposalApproved fue emitido
    const approvedEvent = receipt.logs?.find((log: any) => {
      try {
        const parsed = this.governanceContract.interface.parseLog(log);
        return parsed?.name === 'ProposalApproved';
      } catch {
        return false;
      }
    });

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      approved: !!approvedEvent,
    };
  }

  /**
   * Veta una propuesta (solo el Elder puede ejecutar esto).
   */
  async veto(proposalId: string, reason: string): Promise<TransactionResult> {
    this.logger.log(`Vetoing proposal ${proposalId}`);
    const tx = await this.governanceContract.veto(proposalId, reason);
    const receipt = await tx.wait(1);
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Finaliza una propuesta aprobada, marcándola como CONFIRMED on-chain.
   */
  async finalizeProposal(proposalId: string): Promise<TransactionResult> {
    this.logger.log(`Finalizing proposal ${proposalId}`);
    const tx = await this.governanceContract.finalizeProposal(proposalId);
    const receipt = await tx.wait(1);
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Asigna un rol (MEMBER=1 o NONE=0) a una dirección on-chain.
   */
  async assignRole(
    address: string,
    userId: string,
    role: number,
  ): Promise<TransactionResult> {
    this.logger.log(`Assigning role ${role} to ${address} (userId: ${userId})`);
    const tx = await this.governanceContract.assignRole(address, userId, role);
    const receipt = await tx.wait(1);
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Transfiere el rol Elder a una nueva dirección.
   */
  async transferEldership(newElderAddress: string): Promise<TransactionResult> {
    this.logger.log(`Transferring eldership to ${newElderAddress}`);
    const tx = await this.governanceContract.transferEldership(newElderAddress);
    const receipt = await tx.wait(1);
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Consulta una propuesta on-chain (solo lectura, sin gas).
   */
  async getProposalOnChain(proposalId: string): Promise<OnChainProposal> {
    const result = await this.governanceContract.getProposal(proposalId);
    return {
      proposalId: result[0],
      contentHash: result[1],
      proposerUserId: result[2],
      votesFor: result[3],
      votesAgainst: result[4],
      createdAt: result[5],
      deadline: result[6],
      status: Number(result[7]),
      exists: result[8],
    };
  }

  /**
   * Consulta el rol de una dirección on-chain (solo lectura, sin gas).
   * Retorna: 0=NONE, 1=MEMBER, 2=ELDER
   */
  async getRoleOnChain(address: string): Promise<number> {
    const role = await this.governanceContract.getRole(address);
    return Number(role);
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
      const signerAddress = await this.wallet.getAddress();
      const [blockNumber, balance] = await Promise.all([
        this.provider.getBlockNumber(),
        this.provider.getBalance(signerAddress),
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
