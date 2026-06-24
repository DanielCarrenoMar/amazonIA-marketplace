// =============================================================================
// BlockchainExplorerController — read-only endpoints for the explorer UI.
// Public (no auth) so the auditor view works without a session.
// =============================================================================

import { Controller, Get, Param, Query } from '@nestjs/common';
import type {
  FindProposalParamsDto,
  ListProposalsDto,
  MemberDto,
  ProposalDetailDto,
  ProposalStatus,
  ProposalSummaryDto,
} from 'event-types';
import { BlockchainExplorerService } from './services/blockchain-explorer.service';

@Controller('api/v1/blockchain/explorer')
export class BlockchainExplorerController {
  constructor(private readonly service: BlockchainExplorerService) {}

  @Get('proposals')
  async findProposals(
    @Query() dto: ListProposalsDto,
  ): Promise<ProposalSummaryDto[]> {
    return this.service.findProposals({
      status: dto.status as ProposalStatus | undefined,
    });
  }

  // Returns null (not 404) when the id is unknown — the frontend handles
  // missing proposals by rendering a not-found state in the route.
  @Get('proposals/:id')
  async findProposal(
    @Param() params: FindProposalParamsDto,
  ): Promise<ProposalDetailDto | null> {
    return this.service.findProposal(params.id);
  }

  @Get('members')
  async findMembers(): Promise<MemberDto[]> {
    return this.service.findMembers();
  }
}
