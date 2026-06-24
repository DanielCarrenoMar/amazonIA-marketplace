import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/pagination.dto';
import type { ProposalStatus } from './proposal-detail.dto';

// 3-value filter per the team guide and the contract decision
// (apps/blockchain-notary/md/guia_desarrollo_equipos.md). The full Prisma
// `ProposalStatus` enum has 5 values (PENDING, APPROVED, VETOED, CONFIRMED,
// FAILED); APPROVED and FAILED are intentionally NOT exposed via the public
// status filter on the explorer list endpoint.
export const PROPOSAL_STATUS_FILTER = ['PENDING', 'CONFIRMED', 'VETOED'] as const;

export class ListProposalsDto extends PaginationDto {
  @IsOptional()
  @IsIn(PROPOSAL_STATUS_FILTER, {
    message: 'status must be one of: PENDING, CONFIRMED, VETOED',
  })
  status?: ProposalStatus;
}
