import 'reflect-metadata';
import { BlockchainExplorerService } from '../../src/blockchain/services/blockchain-explorer.service';

// =============================================================================
// BlockchainExplorerService — read-only mapping tests.
// PrismaService is mocked with useValue per the seller.service.spec.ts pattern.
// =============================================================================

describe('BlockchainExplorerService', () => {
  // ── Fixtures ──────────────────────────────────────────────────────────────
  const FIXED_DATE = new Date('2026-06-23T14:30:00.000Z');

  const proposerUser = { id: 'user-proposer', fullName: 'Ana Proponente' };
  const voterUser1 = { id: 'user-voter-1', fullName: 'Bruno Voter' };

  const proposalRows = [
    {
      id: 'prop-1',
      proposalId: 'p-1',
      contentHash: '0xhash1',
      proposerUserId: proposerUser.id,
      status: 'PENDING',
      votesFor: 3,
      votesAgainst: 1,
      vetoReason: null,
      vetoedBy: null,
      transactionHash: null,
      blockNumber: null,
      gasUsed: null,
      deadline: FIXED_DATE,
      createdAt: FIXED_DATE,
      confirmedAt: null,
      title: 'Notarización de Jarrón',
      description: 'Evaluación de autenticidad para el jarrón',
      productId: 'prod-999',
      buyerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    },
    {
      id: 'prop-2',
      proposalId: 'p-2',
      contentHash: '0xhash2',
      proposerUserId: 'user-orphan',
      status: 'CONFIRMED',
      votesFor: 5,
      votesAgainst: 0,
      vetoReason: null,
      vetoedBy: null,
      transactionHash: null,
      blockNumber: null,
      gasUsed: null,
      deadline: FIXED_DATE,
      createdAt: FIXED_DATE,
      confirmedAt: null,
      title: null,
      description: null,
      productId: null,
      buyerAddress: null,
    },
  ];

  const detailedProposal = {
    ...proposalRows[0],
    votes: [
      {
        id: 'vote-1',
        proposalId: 'prop-1',
        voterId: 'gm-1',
        inFavor: true,
        weight: 1,
        txHash: null,
        createdAt: FIXED_DATE,
        voter: { id: 'gm-1', userId: voterUser1.id, walletAddress: '0x1' },
      },
      {
        id: 'vote-2',
        proposalId: 'prop-1',
        voterId: 'gm-2',
        inFavor: false,
        weight: 1,
        txHash: null,
        createdAt: FIXED_DATE,
        voter: { id: 'gm-2', userId: 'user-orphan-voter', walletAddress: '0x2' },
      },
    ],
  };

  const memberUser1 = {
    id: 'gm-user-1',
    fullName: 'Artesano Mayor',
    email: 'mayor@amazonia.com',
  };

  const memberRows = [
    {
      id: 'gm-1',
      userId: memberUser1.id,
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      role: 'ELDER',
      assignedAt: FIXED_DATE,
      assignedBy: null,
    },
    {
      id: 'gm-2',
      userId: 'gm-user-orphan',
      walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      role: 'MEMBER',
      assignedAt: FIXED_DATE,
      assignedBy: null,
    },
  ];

  // ── Mock ─────────────────────────────────────────────────────────────────
  const prismaMock = {
    proposal: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    governanceMember: {
      findMany: jest.fn(),
    },
    userAccount: {
      findMany: jest.fn(),
    },
  } as any;

  const service = new BlockchainExplorerService(prismaMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── findProposals ────────────────────────────────────────────────────────
  describe('findProposals', () => {
    it('returns an array of ProposalSummaryDto with frontend-shape mapping', async () => {
      prismaMock.proposal.findMany.mockResolvedValue([proposalRows[0]]);
      prismaMock.userAccount.findMany.mockResolvedValue([proposerUser]);

      const result = await service.findProposals();

      expect(result).toEqual([
        {
          id: 'prop-1',
          title: 'Notarización de Jarrón',
          proposerName: 'Ana Proponente',
          status: 'PENDING',
          votesFor: 3,
          votesAgainst: 1,
          createdAt: FIXED_DATE.toISOString(),
        },
      ]);
    });

    it('forwards the status filter to prisma.where', async () => {
      prismaMock.proposal.findMany.mockResolvedValue([]);

      await service.findProposals({ status: 'CONFIRMED' });

      expect(prismaMock.proposal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'CONFIRMED' },
        }),
      );
    });

    it('orders by createdAt DESC, id ASC and omits status filter when none given', async () => {
      prismaMock.proposal.findMany.mockResolvedValue([]);

      await service.findProposals();

      expect(prismaMock.proposal.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      });
    });

    it('returns proposerName null when proposer UserAccount is missing', async () => {
      prismaMock.proposal.findMany.mockResolvedValue([proposalRows[1]]);
      prismaMock.userAccount.findMany.mockResolvedValue([proposerUser]);

      const [result] = await service.findProposals();

      expect(result.proposerName).toBeNull();
    });

    it('returns an empty array when DB has no proposals', async () => {
      prismaMock.proposal.findMany.mockResolvedValue([]);

      const result = await service.findProposals();

      expect(result).toEqual([]);
      // Short-circuit: should not hit userAccount when no proposals
      expect(prismaMock.userAccount.findMany).not.toHaveBeenCalled();
    });

    it('preserves the proposal status enum (PENDING/CONFIRMED/VETOED) verbatim', async () => {
      const variants = [
        { ...proposalRows[0], id: 'p-a', status: 'PENDING' as const },
        { ...proposalRows[0], id: 'p-b', status: 'CONFIRMED' as const },
        { ...proposalRows[0], id: 'p-c', status: 'VETOED' as const },
      ];
      prismaMock.proposal.findMany.mockResolvedValue(variants);
      prismaMock.userAccount.findMany.mockResolvedValue([proposerUser]);

      const result = await service.findProposals();

      expect(result.map((p) => p.status)).toEqual([
        'PENDING',
        'CONFIRMED',
        'VETOED',
      ]);
    });
  });

  // ── findProposal ─────────────────────────────────────────────────────────
  describe('findProposal', () => {
    it('returns the detail DTO with proposerName and memberName enriched', async () => {
      prismaMock.proposal.findUnique.mockResolvedValue(detailedProposal);
      prismaMock.userAccount.findMany.mockResolvedValue([
        proposerUser,
        voterUser1,
      ]);

      const result = await service.findProposal('prop-1');

      expect(result).toMatchObject({
        id: 'prop-1',
        title: 'Notarización de Jarrón',
        proposerName: 'Ana Proponente',
        description: 'Evaluación de autenticidad para el jarrón',
        productId: 'prod-999',
        buyerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        status: 'PENDING',
        votesFor: 3,
        votesAgainst: 1,
        votes: [
          {
            id: 'vote-1',
            memberName: 'Bruno Voter',
            voteType: 'FAVOR',
            createdAt: FIXED_DATE.toISOString(),
          },
          {
            id: 'vote-2',
            memberName: null,
            voteType: 'AGAINST',
            createdAt: FIXED_DATE.toISOString(),
          },
        ],
      });
    });

    it('returns memberName null when voter UserAccount is missing', async () => {
      prismaMock.proposal.findUnique.mockResolvedValue(detailedProposal);
      prismaMock.userAccount.findMany.mockResolvedValue([proposerUser]);

      const [vote] = (await service.findProposal('prop-1'))!.votes;

      expect(vote.memberName).toBeNull();
    });

    it('returns proposerName null when proposer UserAccount is missing', async () => {
      const orphan = {
        ...detailedProposal,
        proposerUserId: 'user-orphan',
      };
      prismaMock.proposal.findUnique.mockResolvedValue(orphan);
      prismaMock.userAccount.findMany.mockResolvedValue([voterUser1]);

      const result = await service.findProposal('prop-1');

      expect(result!.proposerName).toBeNull();
    });

    it('returns description/productId/buyerAddress null when missing on the row', async () => {
      const sparse = {
        ...detailedProposal,
        description: null,
        productId: null,
        buyerAddress: null,
        title: null,
      };
      prismaMock.proposal.findUnique.mockResolvedValue(sparse);
      prismaMock.userAccount.findMany.mockResolvedValue([
        proposerUser,
        voterUser1,
      ]);

      const result = await service.findProposal('prop-1');

      expect(result!.description).toBeNull();
      expect(result!.productId).toBeNull();
      expect(result!.buyerAddress).toBeNull();
      expect(result!.title).toBeNull();
    });

    it('maps Vote.inFavor true to voteType FAVOR and false to AGAINST', async () => {
      prismaMock.proposal.findUnique.mockResolvedValue(detailedProposal);
      prismaMock.userAccount.findMany.mockResolvedValue([
        proposerUser,
        voterUser1,
      ]);

      const result = await service.findProposal('prop-1');

      expect(result!.votes.map((v) => v.voteType)).toEqual([
        'FAVOR',
        'AGAINST',
      ]);
    });

    it('returns votes as an empty array when the proposal has none', async () => {
      const noVotes = { ...detailedProposal, votes: [] };
      prismaMock.proposal.findUnique.mockResolvedValue(noVotes);
      prismaMock.userAccount.findMany.mockResolvedValue([proposerUser]);

      const result = await service.findProposal('prop-1');

      expect(result!.votes).toEqual([]);
    });

    it('returns null when the proposal id is unknown', async () => {
      prismaMock.proposal.findUnique.mockResolvedValue(null);

      const result = await service.findProposal('does-not-exist');

      expect(result).toBeNull();
      // No user lookup should run
      expect(prismaMock.userAccount.findMany).not.toHaveBeenCalled();
    });
  });

  // ── findMembers ──────────────────────────────────────────────────────────
  describe('findMembers', () => {
    it('queries prisma with role filter MEMBER|ELDER and the expected orderBy', async () => {
      prismaMock.governanceMember.findMany.mockResolvedValue([]);
      prismaMock.userAccount.findMany.mockResolvedValue([]);

      await service.findMembers();

      expect(prismaMock.governanceMember.findMany).toHaveBeenCalledWith({
        where: { role: { in: ['MEMBER', 'ELDER'] } },
        orderBy: [{ assignedAt: 'desc' }, { id: 'asc' }],
      });
    });

    it('maps rows into the frontend shape with nested user data', async () => {
      prismaMock.governanceMember.findMany.mockResolvedValue(memberRows);
      prismaMock.userAccount.findMany.mockResolvedValue([memberUser1]);

      const result = await service.findMembers();

      expect(result).toEqual([
        {
          id: 'gm-1',
          userId: memberUser1.id,
          walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          role: 'ELDER',
          user: { name: 'Artesano Mayor', email: 'mayor@amazonia.com' },
        },
        {
          id: 'gm-2',
          userId: 'gm-user-orphan',
          walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
          role: 'MEMBER',
          user: { name: null, email: null },
        },
      ]);
    });

    it('returns user { name: null, email: null } when member has no UserAccount', async () => {
      prismaMock.governanceMember.findMany.mockResolvedValue([memberRows[1]]);
      prismaMock.userAccount.findMany.mockResolvedValue([]);

      const [result] = await service.findMembers();

      expect(result.user).toEqual({ name: null, email: null });
    });

    it('returns an empty array when no members exist', async () => {
      prismaMock.governanceMember.findMany.mockResolvedValue([]);

      const result = await service.findMembers();

      expect(result).toEqual([]);
      expect(prismaMock.userAccount.findMany).not.toHaveBeenCalled();
    });
  });
});
