import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { VetoProposalDto } from './dto/veto-proposal.dto';
import { FinalizeProposalDto } from './dto/finalize-proposal.dto';
import { ProposalStatus } from '@prisma/client';

@Controller('governance')
@UseGuards(ApiKeyGuard)
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Post('members')
  @HttpCode(HttpStatus.CREATED)
  async addMember(@Body() dto: AddMemberDto) {
    return this.governanceService.addMember(dto.userId, dto.walletAddress);
  }

  @Post('proposals')
  @HttpCode(HttpStatus.CREATED)
  async createProposal(@Body() dto: CreateProposalDto) {
    return this.governanceService.createProposal(
      dto.proposalId,
      dto.contentHash,
      dto.proposerUserId,
      dto.deadlineMinutes,
    );
  }

  @Post('proposals/:id/vote')
  @HttpCode(HttpStatus.OK)
  async vote(@Param('id') proposalId: string, @Body() dto: CastVoteDto) {
    return this.governanceService.vote(proposalId, dto.voterUserId, dto.inFavor);
  }

  @Post('proposals/:id/veto')
  @HttpCode(HttpStatus.OK)
  async veto(@Param('id') proposalId: string, @Body() dto: VetoProposalDto) {
    return this.governanceService.veto(proposalId, dto.elderUserId, dto.reason);
  }

  @Post('proposals/:id/finalize')
  @HttpCode(HttpStatus.OK)
  async finalize(@Param('id') proposalId: string, @Body() dto: FinalizeProposalDto) {
    return this.governanceService.finalize(proposalId, dto.elderUserId);
  }

  @Get('proposals/:id')
  async getProposal(@Param('id') proposalId: string) {
    return this.governanceService.getProposal(proposalId);
  }

  @Get('proposals')
  async listProposals(
    @Query('status') status?: ProposalStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.governanceService.listProposals(
      status,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }
}
