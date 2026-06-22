// =============================================================================
// GovernanceService — Orquestación de la lógica del Cabildo Comunitario
// Coordina: DB (Prisma) → Blockchain (BlockchainService) → Callback (WebhookService)
// =============================================================================

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { WebhookService } from '../webhook/webhook.service';
import { GovernanceStatusEnum, GovernanceRoleEnum } from 'event-types';
import { ContractRole } from '../blockchain/contracts/governance-registry.abi';
import { ProposalStatus, GovernanceRole } from '@prisma/client';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { VetoProposalDto } from './dto/veto-proposal.dto';
import { AssignRoleDto, TransferEldershipDto } from './dto/assign-role.dto';

@Injectable()
export class GovernanceService {
  private readonly logger = new Logger(GovernanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
    private readonly webhookService: WebhookService,
  ) {}

  // ── Propuestas ─────────────────────────────────────────────────────────────

  /**
   * Crea una propuesta nueva en DB + blockchain.
   * Patrón: DB primero → Blockchain → actualizar DB con txHash
   */
  async createProposal(dto: CreateProposalDto) {
    const deadline = new Date(Date.now() + dto.deadlineMinutes * 60 * 1000);

    // 1. Verificar que no exista ya la propuesta
    const existing = await this.prisma.proposal.findUnique({
      where: { proposalId: dto.proposalId },
    });
    if (existing) {
      throw new ConflictException(`Propuesta '${dto.proposalId}' ya existe`);
    }

    // 2. Crear registro en DB con estado PENDING
    const proposal = await this.prisma.proposal.create({
      data: {
        proposalId: dto.proposalId,
        contentHash: dto.contentHash,
        proposerUserId: dto.proposerUserId,
        deadline,
        status: ProposalStatus.PENDING,
      },
    });

    // 3. Crear propuesta on-chain (fire-and-forget con actualización posterior)
    this.submitProposalOnChain(proposal.id, dto, deadline).catch((err) =>
      this.logger.error(`Failed to submit proposal on-chain: ${err.message}`),
    );

    return {
      accepted: true,
      proposalId: dto.proposalId,
      message: 'Propuesta recibida. Se registrará en blockchain y el resultado se enviará via webhook.',
    };
  }

  private async submitProposalOnChain(
    internalId: string,
    dto: CreateProposalDto,
    deadline: Date,
  ) {
    try {
      const result = await this.blockchainService.createProposal(
        dto.proposalId,
        dto.contentHash,
        dto.proposerUserId,
        deadline,
      );
      await this.prisma.proposal.update({
        where: { id: internalId },
        data: {
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed,
        },
      });
      this.logger.log(`Proposal ${dto.proposalId} registered on-chain: ${result.transactionHash}`);
    } catch (error) {
      this.logger.error(`On-chain proposal creation failed: ${error.message}`);
    }
  }

  /**
   * Emite un voto de un miembro en una propuesta.
   * Si el voto alcanza quórum → finaliza on-chain y notifica via webhook.
   */
  async castVote(proposalId: string, dto: CastVoteDto) {
    // 1. Buscar propuesta y miembro
    const proposal = await this.prisma.proposal.findUnique({
      where: { proposalId },
    });
    if (!proposal) throw new NotFoundException(`Propuesta '${proposalId}' no encontrada`);
    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException(`Propuesta no está abierta para votos (estado: ${proposal.status})`);
    }
    if (new Date() > proposal.deadline) {
      throw new BadRequestException('La votación ha cerrado (deadline expirado)');
    }

    const member = await this.prisma.governanceMember.findUnique({
      where: { userId: dto.voterUserId },
    });
    if (!member) throw new NotFoundException(`Miembro '${dto.voterUserId}' no encontrado`);

    // 2. Verificar que no haya votado ya
    const existingVote = await this.prisma.vote.findUnique({
      where: { proposalId_voterId: { proposalId: proposal.id, voterId: member.id } },
    });
    if (existingVote) {
      throw new ConflictException(`El miembro '${dto.voterUserId}' ya votó en esta propuesta`);
    }

    const weight = member.role === GovernanceRole.ELDER ? 3 : 1;

    // 3. Crear voto en DB
    const vote = await this.prisma.vote.create({
      data: {
        proposalId: proposal.id,
        voterId: member.id,
        inFavor: dto.inFavor,
        weight,
      },
    });

    // 4. Actualizar contadores de votos en DB
    const updatedProposal = await this.prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        votesFor: { increment: dto.inFavor ? weight : 0 },
        votesAgainst: { increment: dto.inFavor ? 0 : weight },
      },
    });

    // 5. Registrar voto on-chain asíncronamente
    this.submitVoteOnChain(proposal.id, vote.id, proposalId, dto.inFavor, updatedProposal).catch(
      (err) => this.logger.error(`Failed to submit vote on-chain: ${err.message}`),
    );

    return {
      success: true,
      voterUserId: dto.voterUserId,
      inFavor: dto.inFavor,
      weight,
      message: 'Voto registrado. Se grabará en blockchain.',
    };
  }

  private async submitVoteOnChain(
    proposalInternalId: string,
    voteId: string,
    proposalId: string,
    inFavor: boolean,
    updatedProposal: any,
  ) {
    try {
      const result = await this.blockchainService.vote(proposalId, inFavor);

      // Actualizar voto con txHash
      await this.prisma.vote.update({
        where: { id: voteId },
        data: { txHash: result.transactionHash },
      });

      // Si el contrato reportó que se alcanzó el quórum → finalizar
      if (result.approved) {
        await this.finalizeApprovedProposal(proposalInternalId, proposalId, result);
      }
    } catch (error) {
      this.logger.error(`On-chain vote failed for proposal ${proposalId}: ${error.message}`);
    }
  }

  private async finalizeApprovedProposal(
    proposalInternalId: string,
    proposalId: string,
    voteResult: any,
  ) {
    try {
      // Marcar como APPROVED en DB
      await this.prisma.proposal.update({
        where: { id: proposalInternalId },
        data: { status: ProposalStatus.APPROVED },
      });
      this.logger.log(`Proposal ${proposalId} reached quorum. Finalizing on-chain...`);

      // Finalizar on-chain
      const finalResult = await this.blockchainService.finalizeProposal(proposalId);

      // Marcar como CONFIRMED en DB
      const finalProposal = await this.prisma.proposal.update({
        where: { id: proposalInternalId },
        data: {
          status: ProposalStatus.CONFIRMED,
          transactionHash: finalResult.transactionHash,
          blockNumber: finalResult.blockNumber,
          gasUsed: finalResult.gasUsed,
          confirmedAt: new Date(),
        },
      });

      this.logger.log(`Proposal ${proposalId} CONFIRMED on-chain: ${finalResult.transactionHash}`);

      // Enviar webhook si está configurado
      // El webhook se dispara con el estado CONFIRMED y el resumen de votos
    } catch (error) {
      this.logger.error(`Finalization failed for proposal ${proposalId}: ${error.message}`);
    }
  }

  /**
   * Veta una propuesta (solo el Elder).
   */
  async vetoProposal(proposalId: string, dto: VetoProposalDto) {
    const proposal = await this.prisma.proposal.findUnique({ where: { proposalId } });
    if (!proposal) throw new NotFoundException(`Propuesta '${proposalId}' no encontrada`);

    const member = await this.prisma.governanceMember.findUnique({
      where: { userId: dto.elderUserId },
    });
    if (!member || member.role !== GovernanceRole.ELDER) {
      throw new BadRequestException(`El usuario '${dto.elderUserId}' no tiene rol de ELDER`);
    }

    if (
      proposal.status !== ProposalStatus.PENDING &&
      proposal.status !== ProposalStatus.APPROVED
    ) {
      throw new BadRequestException(`No se puede vetar en estado: ${proposal.status}`);
    }

    // Registrar veto on-chain
    const result = await this.blockchainService.veto(proposalId, dto.reason);

    // Actualizar DB
    const vetoed = await this.prisma.proposal.update({
      where: { proposalId },
      data: {
        status: ProposalStatus.VETOED,
        vetoReason: dto.reason,
        vetoedBy: dto.elderUserId,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
      },
    });

    this.logger.log(`Proposal ${proposalId} VETOED by ${dto.elderUserId}: ${dto.reason}`);
    return vetoed;
  }

  /**
   * Consulta el estado de una propuesta desde la DB.
   */
  async getProposal(proposalId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { proposalId },
      include: { votes: { include: { voter: true } } },
    });
    if (!proposal) throw new NotFoundException(`Propuesta '${proposalId}' no encontrada`);
    return proposal;
  }

  /**
   * Lista propuestas con filtro opcional por status.
   */
  async listProposals(status?: ProposalStatus) {
    return this.prisma.proposal.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Roles ─────────────────────────────────────────────────────────────────

  /**
   * Asigna el rol MEMBER a un usuario y lo registra on-chain.
   */
  async assignRole(dto: AssignRoleDto) {
    const roleValue = dto.role === GovernanceRoleEnum.MEMBER ? ContractRole.MEMBER : ContractRole.NONE;

    // Registrar o actualizar miembro en DB
    const member = await this.prisma.governanceMember.upsert({
      where: { userId: dto.targetUserId },
      create: {
        userId: dto.targetUserId,
        walletAddress: dto.targetWalletAddress,
        role: GovernanceRole[dto.role as keyof typeof GovernanceRole],
        assignedBy: dto.elderUserId,
      },
      update: {
        role: GovernanceRole[dto.role as keyof typeof GovernanceRole],
        assignedBy: dto.elderUserId,
      },
    });

    // Registrar on-chain
    const result = await this.blockchainService.assignRole(
      dto.targetWalletAddress,
      dto.targetUserId,
      roleValue,
    );

    this.logger.log(`Role ${dto.role} assigned to ${dto.targetUserId} on-chain: ${result.transactionHash}`);
    return { member, transactionHash: result.transactionHash };
  }

  /**
   * Transfiere el rol de Elder a otro miembro.
   */
  async transferEldership(dto: TransferEldershipDto) {
    // Actualizar DB: poner al nuevo Elder
    const newElder = await this.prisma.governanceMember.upsert({
      where: { userId: dto.newElderUserId },
      create: {
        userId: dto.newElderUserId,
        walletAddress: dto.newElderWalletAddress,
        role: GovernanceRole.ELDER,
      },
      update: {
        role: GovernanceRole.ELDER,
        walletAddress: dto.newElderWalletAddress,
      },
    });

    // Registrar on-chain
    const result = await this.blockchainService.transferEldership(dto.newElderWalletAddress);
    this.logger.log(`Eldership transferred to ${dto.newElderUserId}: ${result.transactionHash}`);
    return { newElder, transactionHash: result.transactionHash };
  }

  /**
   * Consulta el rol de un miembro por userId.
   */
  async getMemberRole(userId: string) {
    const member = await this.prisma.governanceMember.findUnique({ where: { userId } });
    if (!member) throw new NotFoundException(`Miembro '${userId}' no encontrado`);
    return { userId: member.userId, role: member.role, walletAddress: member.walletAddress };
  }
}
