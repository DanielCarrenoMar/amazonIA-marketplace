import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { WebhookService } from '../webhook/webhook.service';
import { GovernanceRole, ProposalStatus, BlockchainStatus, ProposalType } from '@prisma/client';

@Injectable()
export class GovernanceService implements OnModuleInit {
  private readonly logger = new Logger(GovernanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
    private readonly webhookService: WebhookService,
  ) {}

  async onModuleInit() {
    // Wait slightly to let the blockchain provider connect
    setTimeout(async () => {
      try {
        await this.syncMembersToBlockchain();
      } catch (err: any) {
        this.logger.error(`Error syncing members to blockchain: ${err.message}`);
      }
      try {
        await this.syncPendingProposals();
      } catch (err: any) {
        this.logger.error(`Error syncing proposals to blockchain: ${err.message}`);
      }
    }, 5000);
  }

  async syncMembersToBlockchain() {
    this.logger.log('Starting synchronization of DB members to Blockchain GovernanceRegistry...');
    
    // Fetch all members from DB with roles MEMBER or ELDER
    const members = await this.prisma.governanceMember.findMany({
      where: {
        role: {
          in: [GovernanceRole.MEMBER, GovernanceRole.ELDER],
        },
      },
    });

    this.logger.log(`Found ${members.length} governance members in DB to verify.`);

    for (const member of members) {
      try {
        const onChainRole = await this.blockchainService.getRole(member.walletAddress);
        const expectedRoleNum = member.role === GovernanceRole.ELDER ? 2 : 1;

        if (onChainRole !== expectedRoleNum) {
          this.logger.log(`Member ${member.userId} (${member.walletAddress}) has role ${onChainRole} on-chain, but DB expects ${expectedRoleNum}. Syncing...`);
          await this.blockchainService.assignRole(
            member.walletAddress,
            member.userId,
            expectedRoleNum,
          );
          this.logger.log(`Successfully synced role for member ${member.userId} on-chain.`);
          // Delay to let Hardhat mine and update provider nonce cache
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } else {
          this.logger.log(`Member ${member.userId} (${member.walletAddress}) is already correctly registered on-chain.`);
        }
      } catch (err: any) {
        this.logger.error(`Failed to sync member ${member.userId} on-chain: ${err.message}`);
      }
    }
    
    this.logger.log('Finished synchronization of members.');
  }

  async syncPendingProposals() {
    this.logger.log('Starting synchronization of PENDING proposals to Blockchain...');
    
    const pendingProposals = await this.prisma.proposal.findMany({
      where: {
        status: ProposalStatus.PENDING,
      },
    });

    this.logger.log(`Found ${pendingProposals.length} pending proposals in DB to verify.`);

    for (const proposal of pendingProposals) {
      try {
        let existsOnChain = false;
        try {
          const onChain = await this.blockchainService.getProposal(proposal.proposalId);
          existsOnChain = onChain && onChain.exists;
        } catch {
          existsOnChain = false;
        }

        if (!existsOnChain) {
          this.logger.log(`Proposal ${proposal.proposalId} missing on-chain. Creating...`);
          let deadlineUnix = Math.floor(new Date(proposal.deadline).getTime() / 1000);
          const nowUnix = Math.floor(Date.now() / 1000);
          if (deadlineUnix <= nowUnix) {
            deadlineUnix = nowUnix + 60 * 60; // extend 1 hour
            const newDeadline = new Date(deadlineUnix * 1000);
            this.logger.log(`Deadline expired. Extending to ${newDeadline.toISOString()}`);
            await this.prisma.proposal.update({
              where: { id: proposal.id },
              data: { deadline: newDeadline },
            });
          }
          await this.blockchainService.createProposal(
            proposal.proposalId,
            proposal.contentHash,
            proposal.proposerUserId,
            deadlineUnix,
          );
          this.logger.log(`Restored proposal ${proposal.proposalId} on-chain.`);
          // Delay to let Hardhat mine and update provider nonce cache
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } else {
          this.logger.log(`Proposal ${proposal.proposalId} already exists on-chain.`);
        }
      } catch (err: any) {
        this.logger.error(`Failed to sync proposal ${proposal.proposalId}: ${err.message}`);
      }
    }

    this.logger.log('Finished synchronization of proposals.');
  }

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
    type: ProposalType = ProposalType.TRANSACTION_NOTARIZATION,
  ) {
    this.logger.log(`Creating proposal: ${proposalId} of type ${type} by proposer: ${proposerUserId}`);

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
        type,
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

    // VALIDACIÓN DE TRIBU: El votante debe pertenecer a la misma tribu de la propuesta
    let proposalTribeId: number | null = null;

    if (proposal.type === ProposalType.TRIBE_ADMISSION || proposal.type === ProposalType.TRIBE_EXPULSION) {
      try {
        const content = JSON.parse(proposal.contentHash);
        if (content && typeof content.tribeId === 'number') {
          proposalTribeId = content.tribeId;
        }
      } catch (parseErr: any) {
        this.logger.error(`Failed to parse contentHash for proposal ${proposalId}: ${parseErr.message}`);
      }
    } else if (proposal.type === ProposalType.TRANSACTION_NOTARIZATION) {
      // El proposerUserId es el sellerId para certificaciones de pago
      const proposerSeller = await this.prisma.seller.findUnique({
        where: { id: proposal.proposerUserId },
      });
      if (proposerSeller && proposerSeller.tribe_id) {
        proposalTribeId = proposerSeller.tribe_id;
      }
    }

    if (proposalTribeId !== null) {
      const voterSeller = await this.prisma.seller.findUnique({
        where: { id: voterUserId },
      });

      if (!voterSeller || voterSeller.tribe_id !== proposalTribeId) {
        this.logger.warn(`User ${voterUserId} tried to vote on proposal ${proposalId} but belongs to tribe ${voterSeller?.tribe_id} (expected ${proposalTribeId})`);
        throw new BadRequestException(`No perteneces a la tribu asociada a esta resolución (Tribu ID: ${proposalTribeId})`);
      }
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

    // Verificar si la propuesta existe on-chain. Si no, la creamos on-chain para corregir el desajuste (ej. tras reinicio de hardhat)
    let proposalExistsOnChain = false;
    try {
      const onChainProposal = await this.blockchainService.getProposal(proposalId);
      proposalExistsOnChain = onChainProposal && onChainProposal.exists;
      this.logger.log(`Proposal ${proposalId} on-chain check: exists=${proposalExistsOnChain}`);
    } catch (err: any) {
      this.logger.warn(`Proposal ${proposalId} on-chain check threw error (likely does not exist): ${err.message}`);
      proposalExistsOnChain = false;
    }

    if (!proposalExistsOnChain) {
      this.logger.warn(`Proposal ${proposalId} exists in DB but not on-chain. Restoring...`);
      // Si el deadline ya pasó, extender a 60 minutos desde ahora
      let deadlineUnix = Math.floor(new Date(proposal.deadline).getTime() / 1000);
      const nowUnix = Math.floor(Date.now() / 1000);
      if (deadlineUnix <= nowUnix) {
        deadlineUnix = nowUnix + 60 * 60; // extender 1 hora
        const newDeadline = new Date(deadlineUnix * 1000);
        this.logger.log(`Deadline was expired. Extending to ${newDeadline.toISOString()}`);
        // Actualizar en DB también
        await this.prisma.proposal.update({
          where: { id: proposal.id },
          data: { deadline: newDeadline },
        });
      }
      try {
        await this.blockchainService.createProposal(
          proposalId,
          proposal.contentHash,
          proposal.proposerUserId,
          deadlineUnix,
        );
        this.logger.log(`Successfully restored proposal ${proposalId} on-chain.`);
      } catch (createErr: any) {
        this.logger.error(`Failed to recreate proposal ${proposalId} on-chain: ${createErr.message}`);
        throw new BadRequestException(`Blockchain error: ${createErr.message}`);
      }
    }

    // Registrar voto en blockchain
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
    this.logger.log(`Finalizing proposal: ${proposalId} by user ${elderUserId}`);

    // Validar Elder o Líder de la tribu asociada
    const elder = await this.prisma.governanceMember.findUnique({
      where: { userId: elderUserId },
    });

    let isAuthorized = elder && elder.role === GovernanceRole.ELDER;

    if (!isAuthorized) {
      const proposal = await this.prisma.proposal.findUnique({
        where: { proposalId },
      });
      if (proposal) {
        if (proposal.type === ProposalType.TRIBE_ADMISSION || proposal.type === ProposalType.TRIBE_EXPULSION) {
          try {
            const content = JSON.parse(proposal.contentHash);
            if (content && typeof content.tribeId === 'number') {
              const tribe = await this.prisma.tribe.findUnique({
                where: { id: content.tribeId },
              });
              if (tribe && (tribe.primary_leader_id === elderUserId || tribe.secondary_leader_id === elderUserId)) {
                isAuthorized = true;
              }
            }
          } catch {
            // ignore
          }
        } else if (proposal.type === ProposalType.TRANSACTION_NOTARIZATION) {
          // Líderes pueden finalizar certificaciones de productos de vendedores en su tribu
          try {
            const seller = await this.prisma.seller.findUnique({
              where: { id: proposal.proposerUserId },
              include: { tribe_tribe_primary_leader_idToseller: true, tribe_tribe_secondary_leader_idToseller: true },
            });
            if (seller && seller.tribe_id) {
              const tribe = await this.prisma.tribe.findUnique({
                where: { id: seller.tribe_id },
              });
              if (tribe && (tribe.primary_leader_id === elderUserId || tribe.secondary_leader_id === elderUserId)) {
                isAuthorized = true;
              }
            }
          } catch {
            // ignore
          }
        }
      }
    }

    if (!isAuthorized) {
      throw new BadRequestException(`User ${elderUserId} is not authorized to finalize this proposal`);
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

    if (passed && proposal.type === ProposalType.TRANSACTION_NOTARIZATION) {
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

    if (passed && proposal.type === ProposalType.TRIBE_ADMISSION) {
      try {
        const metadata = JSON.parse(proposal.contentHash);
        this.logger.log(`Tribe Admission approved. Syncing DB for user ${metadata.userId} to tribe ${metadata.tribeId}`);
        await this.prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`
            INSERT INTO seller (id, description)
            VALUES ('${metadata.userId}'::uuid, 'Miembro de la tribu')
            ON CONFLICT (id) DO NOTHING;
          `);
          await tx.$executeRawUnsafe(`
            UPDATE seller SET tribe_id = ${metadata.tribeId} WHERE id = '${metadata.userId}'::uuid;
          `);
          await tx.$executeRawUnsafe(`
            UPDATE user_account SET role = 'SELLER' WHERE id = '${metadata.userId}'::uuid;
          `);
          await tx.$executeRawUnsafe(`
            UPDATE tribe_membership_request 
            SET status = 'APPROVED', reviewed_at = NOW(), review_note = 'Aprobado por votación comunitaria'
            WHERE seller_id = '${metadata.userId}'::uuid AND tribe_id = ${metadata.tribeId} AND status = 'PENDING';
          `);
        });
        this.logger.log(`Tribe Admission database sync complete.`);
      } catch (e: any) {
        this.logger.error(`Error syncing Tribe Admission database state: ${e.message}`);
      }
    }

    if (passed && proposal.type === ProposalType.TRIBE_EXPULSION) {
      try {
        const metadata = JSON.parse(proposal.contentHash);
        this.logger.log(`Tribe Expulsion approved. Syncing DB to remove user ${metadata.userId}`);
        await this.prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`
            UPDATE seller SET tribe_id = NULL WHERE id = '${metadata.userId}'::uuid;
          `);
          await tx.$executeRawUnsafe(`
            UPDATE user_account SET role = 'BUYER' WHERE id = '${metadata.userId}'::uuid;
          `);
        });
        this.logger.log(`Tribe Expulsion database sync complete.`);
      } catch (e: any) {
        this.logger.error(`Error syncing Tribe Expulsion database state: ${e.message}`);
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
