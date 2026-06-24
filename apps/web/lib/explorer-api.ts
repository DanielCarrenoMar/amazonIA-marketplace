import { mockProposals, mockProposalDetail, mockMembers, ProposalSummary, ProposalDetail, GovernanceMember } from './explorer-mock';

// Endpoint 1: GET /api/v1/blockchain/explorer/proposals
export async function getExplorerProposals(): Promise<ProposalSummary[]> {
  // Simulator fetch delay
  return new Promise(resolve => setTimeout(() => resolve(mockProposals), 500));
}

// Endpoint 2: GET /api/v1/blockchain/explorer/proposals/:id
export async function getExplorerProposalById(id: string): Promise<ProposalDetail | null> {
  return new Promise(resolve => setTimeout(() => resolve(mockProposalDetail[id] || null), 500));
}

// Endpoint 3: GET /api/v1/blockchain/explorer/members
export async function getExplorerMembers(): Promise<GovernanceMember[]> {
  return new Promise(resolve => setTimeout(() => resolve(mockMembers), 500));
}
