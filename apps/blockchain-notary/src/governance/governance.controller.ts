import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { VetoProposalDto } from './dto/veto-proposal.dto';
import { AssignRoleDto, TransferEldershipDto } from './dto/assign-role.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ProposalStatus } from '@prisma/client';

@UseGuards(AuthGuard)
@Controller('governance')
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  // ── Propuestas ─────────────────────────────────────────────────────────────

  /**
   * POST /governance/proposals
   * Crea una nueva propuesta de gobernanza.
   */
  @Post('proposals')
  @HttpCode(HttpStatus.ACCEPTED)
  async createProposal(@Body() dto: CreateProposalDto) {
    return this.governanceService.createProposal(dto);
  }

  /**
   * GET /governance/proposals
   * Lista propuestas. Acepta ?status=PENDING|APPROVED|VETOED|CONFIRMED|FAILED
   */
  @Get('proposals')
  async listProposals(@Query('status') status?: ProposalStatus) {
    return this.governanceService.listProposals(status);
  }

  /**
   * GET /governance/proposals/:proposalId
   * Consulta el estado completo de una propuesta con sus votos.
   */
  @Get('proposals/:proposalId')
  async getProposal(@Param('proposalId') proposalId: string) {
    return this.governanceService.getProposal(proposalId);
  }

  // ── Votación ──────────────────────────────────────────────────────────────

  /**
   * POST /governance/proposals/:proposalId/vote
   * Un miembro emite su voto en una propuesta abierta.
   */
  @Post('proposals/:proposalId/vote')
  @HttpCode(HttpStatus.ACCEPTED)
  async castVote(@Param('proposalId') proposalId: string, @Body() dto: CastVoteDto) {
    return this.governanceService.castVote(proposalId, dto);
  }

  // ── Veto ──────────────────────────────────────────────────────────────────

  /**
   * POST /governance/proposals/:proposalId/veto
   * El Elder veta una propuesta.
   */
  @Post('proposals/:proposalId/veto')
  async vetoProposal(@Param('proposalId') proposalId: string, @Body() dto: VetoProposalDto) {
    return this.governanceService.vetoProposal(proposalId, dto);
  }

  // ── Roles ──────────────────────────────────────────────────────────────────

  /**
   * POST /governance/roles
   * El Elder asigna un rol a un miembro de la comunidad.
   */
  @Post('roles')
  @HttpCode(HttpStatus.CREATED)
  async assignRole(@Body() dto: AssignRoleDto) {
    return this.governanceService.assignRole(dto);
  }

  /**
   * POST /governance/elder/transfer
   * El Elder transfiere el liderazgo a otro miembro.
   */
  @Post('elder/transfer')
  async transferEldership(@Body() dto: TransferEldershipDto) {
    return this.governanceService.transferEldership(dto);
  }

  /**
   * GET /governance/members/:userId/role
   * Consulta el rol de un miembro.
   */
  @Get('members/:userId/role')
  async getMemberRole(@Param('userId') userId: string) {
    return this.governanceService.getMemberRole(userId);
  }
}
