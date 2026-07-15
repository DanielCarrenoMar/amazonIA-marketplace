// =============================================================================
// BlockchainExplorerService — read-only queries for the explorer UI.
// Joins Proposal/Vote → UserAccount to populate proposerName and memberName
// in the shape the frontend contract expects.
// =============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  MemberDto,
  MemberRole,
  ProposalDetailDto,
  ProposalStatus,
  ProposalSummaryDto,
  VoteDto,
  VoteType,
} from 'event-types';

// ponytail: schema is per schemas.md (no metadata columns); returns null until DB is extended
const MISSING_METADATA: string | null = null;

@Injectable()
export class BlockchainExplorerService {
  constructor(private readonly prisma: PrismaService) {}

  async findProposals(filter?: {
    status?: ProposalStatus;
  }): Promise<ProposalSummaryDto[]> {
    const proposals = await this.prisma.proposal.findMany({
      where: filter?.status ? { status: filter.status } : {},
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });

    if (proposals.length === 0) return [];

    const proposerIds = [
      ...new Set(proposals.map((p) => p.proposerUserId)),
    ];
    const users = await this.prisma.userAccount.findMany({
      where: { id: { in: proposerIds } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.fullName]));

    return proposals.map((p) => ({
      id: p.proposalId,
      title: MISSING_METADATA,
      proposerName: userMap.get(p.proposerUserId) ?? null,
      status: p.status as ProposalStatus,
      votesFor: p.votesFor,
      votesAgainst: p.votesAgainst,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async findProposal(id: string): Promise<ProposalDetailDto | null> {
    const proposal = await this.prisma.proposal.findUnique({
      where: { proposalId: id },
      include: { votes: { include: { voter: true } } },
    });

    if (!proposal) return null;

    const userIds = [
      proposal.proposerUserId,
      ...proposal.votes.map((v) => v.voter.userId),
    ];
    const users = await this.prisma.userAccount.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.fullName]));

    const votes: VoteDto[] = proposal.votes.map((v) => ({
      id: v.id,
      memberName: userMap.get(v.voter.userId) ?? null,
      voteType: (v.inFavor ? 'FAVOR' : 'AGAINST') as VoteType,
      createdAt: v.createdAt.toISOString(),
    }));

    return {
      id: proposal.proposalId,
      title: MISSING_METADATA,
      proposerName: userMap.get(proposal.proposerUserId) ?? null,
      status: proposal.status as ProposalStatus,
      votesFor: proposal.votesFor,
      votesAgainst: proposal.votesAgainst,
      createdAt: proposal.createdAt.toISOString(),
      description: MISSING_METADATA,
      productId: MISSING_METADATA,
      buyerAddress: MISSING_METADATA,
      votes,
    };
  }

  async findMembers(): Promise<MemberDto[]> {
    const members = await this.prisma.governanceMember.findMany({
      where: { role: { in: ['MEMBER', 'ELDER'] } },
      orderBy: [{ assignedAt: 'desc' }, { id: 'asc' }],
    });

    if (members.length === 0) return [];

    const userIds = members.map((m) => m.userId);
    const users = await this.prisma.userAccount.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, email: true },
    });
    const userMap = new Map(
      users.map((u) => [u.id, { name: u.fullName, email: u.email }]),
    );

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      walletAddress: m.walletAddress,
      role: m.role as MemberRole,
      user: userMap.get(m.userId) ?? { name: null, email: null },
    }));
  }
}
