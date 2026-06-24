// =============================================================================
// Proposal DTOs — match apps/web/lib/explorer-mock.ts `ProposalSummary`,
// `VoteRegistry`, and `ProposalDetail` exactly.
// All context fields are nullable for backward compatibility with existing
// Proposal rows that predate the title/description/productId/buyerAddress
// columns added in the blockchain-explorer change.
// =============================================================================

export type ProposalStatus = 'PENDING' | 'CONFIRMED' | 'VETOED';
export type VoteType = 'FAVOR' | 'AGAINST';

export interface ProposalSummaryDto {
  id: string;
  title: string | null;
  proposerName: string | null;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  createdAt: string; // ISO
}

export interface VoteDto {
  id: string;
  memberName: string | null;
  voteType: VoteType;
  createdAt: string;
}

export interface ProposalDetailDto extends ProposalSummaryDto {
  description: string | null;
  productId: string | null;
  buyerAddress: string | null;
  votes: VoteDto[];
}
