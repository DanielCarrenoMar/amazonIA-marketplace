import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { WebhookService } from '../webhook/webhook.service';
import { GovernanceRole, ProposalStatus, BlockchainStatus } from '@prisma/client';

@Injectable()
export class GovernanceService {
  private readonly logger = new Logger(GovernanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
    private readonly webhookService: WebhookService,
  ) {}

  /**
   * Agrega un nuevo miembro a la gobernanza (DB + On-chain)
   */
  async addMember(userId: string, walletAddress: string) {
    this.logger.log(`Adding member: ${userId} with wallet: ${walletAddress}`);

    // Validar si ya existe
    const existing = await this.prisma.governanceMember.findUnique({
      where: { userId },
    });

    if (existing && existing.role !== GovernanceRole.NONE) {
      throw new BadRequestException(`User ${userId} is already a governance member`);
    }

    // Registrar en blockchain
    let txResult;
    try {
      txResult = await this.blockchainService.assignRole(walletAddress, userId, 1); // 1 = MEMBER
    } catch (error: any) {
      this.logger.error(`Failed to assign role on-chain: ${error.message}`);
      throw new BadRequestException(`Blockchain error: ${error.message}`);
    }

    // Guardar en DB
    const member = await this.prisma.governanceMember.upsert({
      where: { userId },
      update: {
        walletAddress,
        role: GovernanceRole.MEMBER,
        assignedBy: 'SYSTEM',
      },
      create: {
        userId,
        walletAddress,
        role: GovernanceRole.MEMBER,
        assignedBy: 'SYSTEM',
      },
    });

    return {
      success: true,
      member,
      transactionHash: txResult.transactionHash,
    };
  }

  /**
   * Crea una propuesta (DB + On-chain)
   */
  async createProposal(
    proposalId: string,
    contentHash: string,
    proposerUserId: string,
    deadlineMinutes: number,
  ) {
    this.logger.log(`Creating proposal: ${proposalId} by proposer: ${proposerUserId}`);

    // Verificar si ya existe
    const existing = await this.prisma.proposal.findUnique({
      where: { proposalId },
    });

    if (existing) {
      throw new BadRequestException(`Proposal ${proposalId} already exists`);
    }

    const deadline = new Date(Date.now() + deadlineMinutes * 60 * 1000);
    const deadlineUnix = Math.floor(deadline.getTime() / 1000);

    // Crear en blockchain
    let txResult;
    try {
      txResult = await this.blockchainService.createProposal(
        proposalId,
        contentHash,
        proposerUserId,
        deadlineUnix,
      );
    } catch (error: any) {
      this.logger.error(`Failed to create proposal on-chain: ${error.message}`);
      throw new BadRequestException(`Blockchain error: ${error.message}`);
    }

    // Crear en DB
    const proposal = await this.prisma.proposal.create({
      data: {
        proposalId,
        contentHash,
        proposerUserId,
        status: ProposalStatus.PENDING,
        deadline,
        transactionHash: txResult.transactionHash,
        blockNumber: txResult.blockNumber,
        gasUsed: txResult.gasUsed,
      },
    });

    return {
      success: true,
      proposal,
      transactionHash: txResult.transactionHash,
    };
  }

  /**
   * Registra un voto para una propuesta (DB + On-chain)
   */
  async vote(proposalId: string, voterUserId: string, inFavor: boolean) {
    this.logger.log(`User ${voterUserId} voting ${inFavor ? 'FOR' : 'AGAINST'} proposal ${proposalId}`);

    // Buscar propuesta en DB
    const proposal = await this.prisma.proposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal ${proposalId} not found`);
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException(`Proposal is not in PENDING status`);
    }

    if (new Date() > proposal.deadline) {
      throw new BadRequestException(`Voting deadline has passed`);
    }

    // Buscar votante en DB
    const voter = await this.prisma.governanceMember.findUnique({
      where: { userId: voterUserId },
    });

    if (!voter || voter.role === GovernanceRole.NONE) {
      throw new BadRequestException(`User ${voterUserId} is not a valid governance member`);
    }

    // Verificar si ya votó
    const alreadyVoted = await this.prisma.vote.findUnique({
      where: {
        proposalId_voterId: {
          proposalId: proposal.id,
          voterId: voter.id,
        },
      },
    });

    if (alreadyVoted) {
      throw new BadRequestException(`User ${voterUserId} has already voted on this proposal`);
    }

    // Registrar en blockchain
    let txResult;
    try {
      txResult = await this.blockchainService.castVote(proposalId, voter.walletAddress, inFavor);
    } catch (error: any) {
      this.logger.error(`Failed to cast vote on-chain: ${error.message}`);
      throw new BadRequestException(`Blockchain error: ${error.message}`);
    }

    // Determinar peso
    const weight = voter.role === GovernanceRole.ELDER ? 3 : 1;

    // Guardar voto y actualizar propuesta en DB
    const [voteRecord] = await this.prisma.$transaction([
      this.prisma.vote.create({
        data: {
          proposalId: proposal.id,
          voterId: voter.id,
          inFavor,
          weight,
          txHash: txResult.transactionHash,
        },
      }),
      this.prisma.proposal.update({
        where: { id: proposal.id },
        data: {
          votesFor: inFavor ? { increment: weight } : undefined,
          votesAgainst: !inFavor ? { increment: weight } : undefined,
        },
      }),
    ]);

    return {
      success: true,
      voteRecord,
      transactionHash: txResult.transactionHash,
    };
  }

  /**
   * Aplica un veto de Elder sobre una propuesta (DB + On-chain)
   */
  async veto(proposalId: string, elderUserId: string, reason: string) {
    this.logger.log(`Elder ${elderUserId} vetoing proposal ${proposalId}. Reason: ${reason}`);

    // Validar Elder
    const elder = await this.prisma.governanceMember.findUnique({
      where: { userId: elderUserId },
    });

    if (!elder || elder.role !== GovernanceRole.ELDER) {
      throw new BadRequestException(`User ${elderUserId} is not an Elder`);
    }

    // Validar Propuesta
    const proposal = await this.prisma.proposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal ${proposalId} not found`);
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException(`Proposal is already finalized or vetoed`);
    }

    // Registrar veto en blockchain
    let txResult;
    try {
      txResult = await this.blockchainService.vetoProposal(proposalId, reason);
    } catch (error: any) {
      this.logger.error(`Failed to veto proposal on-chain: ${error.message}`);
      throw new BadRequestException(`Blockchain error: ${error.message}`);
    }

    // Actualizar propuesta en DB
    const updatedProposal = await this.prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: ProposalStatus.VETOED,
        vetoReason: reason,
        vetoedBy: elderUserId,
      },
    });

    // Actualizar BlockchainRecord si existe
    const record = await this.prisma.blockchainRecord.findUnique({
      where: { orderId: proposalId },
    });

    if (record) {
      await this.prisma.blockchainRecord.update({
        where: { orderId: proposalId },
        data: {
          status: BlockchainStatus.FAILED,
          errorMessage: `Vetoed by Elder: ${reason}`,
          confirmedAt: new Date(),
        },
      });

      // Notificar al backend via webhook
      if (record.webhookUrl) {
        const payload = this.webhookService.buildFailurePayload(
          proposalId,
          `Vetoed by Elder: ${reason}`,
        );
        await this.webhookService.notifyBackend(record.webhookUrl, payload);
      }
    }

    return {
      success: true,
      proposal: updatedProposal,
      transactionHash: txResult.transactionHash,
    };
  }

  /**
   * Finaliza una propuesta (DB + On-chain)
   */
  async finalize(proposalId: string, elderUserId: string) {
    this.logger.log(`Finalizing proposal: ${proposalId} by Elder ${elderUserId}`);

    // Validar Elder
    const elder = await this.prisma.governanceMember.findUnique({
      where: { userId: elderUserId },
    });

    if (!elder || elder.role !== GovernanceRole.ELDER) {
      throw new BadRequestException(`User ${elderUserId} is not an Elder`);
    }

    // Validar Propuesta
    const proposal = await this.prisma.proposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal ${proposalId} not found`);
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException(`Proposal is already finalized`);
    }

    // Finalizar en blockchain
    let txResult;
    try {
      txResult = await this.blockchainService.finalizeProposal(proposalId);
    } catch (error: any) {
      this.logger.error(`Failed to finalize proposal on-chain: ${error.message}`);
      throw new BadRequestException(`Blockchain error: ${error.message}`);
    }

    // Determinar resultado
    const passed = proposal.votesFor > proposal.votesAgainst;
    const finalStatus = passed ? ProposalStatus.CONFIRMED : ProposalStatus.FAILED;

    // Actualizar propuesta en DB
    const updatedProposal = await this.prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: finalStatus,
        confirmedAt: new Date(),
      },
    });

    // Acuñar el NFT de autenticidad si la propuesta fue aprobada
    let nftTokenId: string | null = null;
    let nftTxHash: string | null = null;

    if (passed) {
      this.logger.log(`Proposal passed. Initiating NFT Minting for order ${proposalId}`);
      try {
        const orderInfo = await this.prisma.$queryRaw<any[]>`
          SELECT 
            o.product_id AS "productId",
            o.buyer_id AS "buyerId",
            p.seller_id AS "sellerId",
            buyer.wallet_hash AS "buyerWallet",
            seller.wallet_hash AS "sellerWallet"
          FROM product_order o
          JOIN product p ON o.product_id = p.id
          LEFT JOIN user_account buyer ON o.buyer_id = buyer.id
          LEFT JOIN user_account seller ON p.seller_id = seller.id
          WHERE o.id = ${proposalId}::uuid
          LIMIT 1
        `;

        if (orderInfo && orderInfo.length > 0) {
          const { productId, buyerId, sellerId, buyerWallet, sellerWallet } = orderInfo[0];
          
          // Fallbacks para desarrollo local si no están configuradas las wallets en DB
          const recipientAddress = buyerWallet || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Account #1
          const artisanAddress = sellerWallet || '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'; // Account #2
          
          const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';
          const tokenURI = `${apiBaseUrl}/products/${productId}/nft-metadata`;
          
          const mintResult = await this.blockchainService.mintNFT(
            artisanAddress,
            recipientAddress,
            proposalId,
            tokenURI,
          );
          
          nftTokenId = mintResult.tokenId;
          nftTxHash = mintResult.transactionHash;
          
          this.logger.log(`NFT successfully minted. Token ID: ${nftTokenId}, Tx Hash: ${nftTxHash}`);
        } else {
          this.logger.warn(`Could not find order details for orderId ${proposalId}. Skipping NFT Mint.`);
        }
      } catch (nftError: any) {
        this.logger.error(`Error minting NFT for order ${proposalId}: ${nftError.message}`);
        // No lanzamos error para que la transacción de gobernanza continúe su confirmación
      }
    }

    // Actualizar BlockchainRecord si existe (para conectar con la notarización)
    const record = await this.prisma.blockchainRecord.findUnique({
      where: { orderId: proposalId },
    });

    if (record) {
      await this.prisma.blockchainRecord.update({
        where: { orderId: proposalId },
        data: {
          status: passed ? BlockchainStatus.CONFIRMED : BlockchainStatus.FAILED,
          transactionHash: txResult.transactionHash,
          blockNumber: txResult.blockNumber,
          gasUsed: txResult.gasUsed,
          errorMessage: passed ? null : 'Proposal rejected by community vote',
          confirmedAt: new Date(),
          nftTokenId: nftTokenId,
          nftTxHash: nftTxHash,
          nftMintedAt: nftTokenId ? new Date() : null,
        },
      });

      // Notificar al backend via webhook
      if (record.webhookUrl) {
        let payload;
        if (passed) {
          payload = this.webhookService.buildSuccessPayload(
            proposalId,
            txResult.transactionHash,
            txResult.blockNumber,
            txResult.gasUsed,
            nftTokenId,
            nftTxHash,
          );
        } else {
          payload = this.webhookService.buildFailurePayload(
            proposalId,
            'Proposal rejected by community vote',
          );
        }
        await this.webhookService.notifyBackend(record.webhookUrl, payload);
      }
    }

    return {
      success: true,
      proposal: updatedProposal,
      passed,
      transactionHash: txResult.transactionHash,
    };
  }

  /**
   * Detalle de propuesta con sus votos
   */
  async getProposal(proposalId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { proposalId },
      include: {
        votes: {
          include: {
            voter: true,
          },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal ${proposalId} not found`);
    }

    return proposal;
  }

  /**
   * Listado paginado de propuestas
   */
  async listProposals(status?: ProposalStatus, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [proposals, total] = await Promise.all([
      this.prisma.proposal.findMany({
        where: status ? { status } : {},
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.proposal.count({
        where: status ? { status } : {},
      }),
    ]);

    return {
      proposals,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
