// =============================================================================
// Proposal DTOs — match apps/web/lib/explorer-mock.ts `ProposalSummary`,
// `VoteRegistry`, and `ProposalDetail` exactly.
// `title`, `description`, `productId`, `buyerAddress` are typed `string | null`
// because the underlying `proposal` table does not have those columns yet —
// see apps/blockchain-notary/md/schemas.md for the authoritative DB DDL.
// The explorer service returns null for them. When the columns are added to
// the DB, the service can populate them and these types stay as-is.
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
  type?: 'TRANSACTION_NOTARIZATION' | 'TRIBE_ADMISSION' | 'TRIBE_EXPULSION';
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
