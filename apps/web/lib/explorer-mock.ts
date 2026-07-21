export type ProposalStatus = 'PENDING' | 'APPROVED' | 'CONFIRMED' | 'VETOED' | 'FAILED';
export type VoteType = 'FAVOR' | 'AGAINST';

// Endpoint 1: GET /api/v1/blockchain/explorer/proposals
export interface ProposalSummary {
  id: string;
  title: string;
  proposerName: string;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  createdAt: string; // ISO Date string
  type?: string;
}

// Endpoint 2: GET /api/v1/blockchain/explorer/proposals/:id
export interface VoteRegistry {
  id: string;
  memberName: string;
  voteType: VoteType;
  createdAt: string;
}

export interface ProposalDetail extends ProposalSummary {
  description: string;
  productId: string;
  buyerAddress: string;
  votes: VoteRegistry[]; // Historial de votos detallado
}

// Endpoint 3: GET /api/v1/blockchain/explorer/members
export interface GovernanceMember {
  id: string;
  userId: string;
  walletAddress: string;
  role: 'MEMBER' | 'ELDER';
  user: {
    name: string;
    email: string;
  };
}

export const mockProposals: ProposalSummary[] = [
  {
    id: "prop-101",
    title: "Notarización de Jarrón de Arcilla Tradicional",
    proposerName: "Sistema Automático (Checkout)",
    status: "PENDING",
    votesFor: 3,
    votesAgainst: 1,
    createdAt: "2026-06-23T14:30:00.000Z"
  },
  {
    id: "prop-102",
    title: "Notarización de Hamaca de Hilo Fino",
    proposerName: "Sistema Automático (Checkout)",
    status: "CONFIRMED",
    votesFor: 5,
    votesAgainst: 0,
    createdAt: "2026-06-22T09:15:00.000Z"
  },
  {
    id: "prop-103",
    title: "Notarización de Réplica Industrial Plástica",
    proposerName: "Sistema Automático (Checkout)",
    status: "VETOED",
    votesFor: 0,
    votesAgainst: 4,
    createdAt: "2026-06-21T18:45:00.000Z"
  }
];

export const mockProposalDetail: Record<string, ProposalDetail> = {
  "prop-101": {
    id: "prop-101",
    title: "Notarización de Jarrón de Arcilla Tradicional",
    proposerName: "Sistema Automático (Checkout)",
    status: "PENDING",
    votesFor: 3,
    votesAgainst: 1,
    createdAt: "2026-06-23T14:30:00.000Z",
    description: "Evaluación de autenticidad para el jarrón elaborado por la comunidad local utilizando técnicas de horneado ancestrales.",
    productId: "prod-999",
    buyerAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    votes: [
      { id: "v-1", memberName: "Artesano Mayor Miguel", voteType: "FAVOR", createdAt: "2026-06-23T15:00:00.000Z" },
      { id: "v-2", memberName: "Consejera Elena", voteType: "FAVOR", createdAt: "2026-06-23T15:10:00.000Z" },
      { id: "v-3", memberName: "Evaluador Juan", voteType: "AGAINST", createdAt: "2026-06-23T15:20:00.000Z" },
    ]
  }
};

export const mockMembers: GovernanceMember[] = [
  {
    id: "mem-1",
    userId: "us-1",
    walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    role: "ELDER",
    user: { name: "Artesano Mayor Miguel", email: "miguel@amazonia.com" }
  },
  {
    id: "mem-2",
    userId: "us-2",
    walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    role: "MEMBER",
    user: { name: "Consejera Elena", email: "elena@amazonia.com" }
  },
  {
    id: "mem-3",
    userId: "us-3",
    walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    role: "MEMBER",
    user: { name: "Evaluador Juan", email: "juan@amazonia.com" }
  }
];
