import { apiFetch, authFetch } from '@/lib/api/client';
import { ProposalSummary, ProposalDetail, GovernanceMember } from './explorer-mock';

const EXPLORER_BASE = '/api/v1/blockchain/explorer';

// Endpoint 1: GET /api/v1/blockchain/explorer/proposals
export async function getExplorerProposals(): Promise<ProposalSummary[]> {
  try {
    const data = await apiFetch<any[]>(`${EXPLORER_BASE}/proposals`);
    return data.map((p) => ({
      id: p.id,
      title: p.title ?? `Propuesta ${String(p.id).slice(0, 8)}`,
      proposerName: p.proposerName ?? 'Sistema Automático (Checkout)',
      status: p.status,
      votesFor: p.votesFor,
      votesAgainst: p.votesAgainst,
      createdAt: p.createdAt,
    }));
  } catch {
    return [];
  }
}

// Endpoint 2: GET /api/v1/blockchain/explorer/proposals/:id
export async function getExplorerProposalById(id: string): Promise<ProposalDetail | null> {
  try {
    const p = await apiFetch<any>(`${EXPLORER_BASE}/proposals/${id}`);
    if (!p) return null;
    return {
      id: p.id,
      title: p.title ?? `Propuesta ${String(p.id).slice(0, 8)}`,
      proposerName: p.proposerName ?? 'Sistema Automático (Checkout)',
      status: p.status,
      votesFor: p.votesFor,
      votesAgainst: p.votesAgainst,
      createdAt: p.createdAt,
      description: p.description ?? 'Propuesta de notarización generada automáticamente al completar la compra.',
      productId: p.productId ?? null,
      buyerAddress: p.buyerAddress ?? null,
      votes: (p.votes ?? []).map((v: any) => ({
        id: v.id,
        memberName: v.memberName ?? 'Miembro del Consejo',
        voteType: v.voteType,
        createdAt: v.createdAt,
      })),
    };
  } catch {
    return null;
  }
}

// Endpoint 3: GET /api/v1/blockchain/explorer/members
export async function getExplorerMembers(): Promise<GovernanceMember[]> {
  try {
    const data = await apiFetch<any[]>(`${EXPLORER_BASE}/members`);
    return data.map((m) => ({
      id: m.id,
      userId: m.userId,
      walletAddress: m.walletAddress,
      role: m.role,
      user: {
        name: m.user?.name ?? 'Sin nombre',
        email: m.user?.email ?? 'Sin email',
      },
    }));
  } catch {
    return [];
  }
}

// Acciones de Gobernanza (Requieren autenticación)
export async function voteProposal(id: string, inFavor: boolean): Promise<any> {
  return authFetch(`${EXPLORER_BASE}/proposals/${id}/vote`, {
    method: 'POST',
    body: JSON.stringify({ inFavor }),
  });
}

export async function finalizeProposal(id: string): Promise<any> {
  return authFetch(`${EXPLORER_BASE}/proposals/${id}/finalize`, {
    method: 'POST',
  });
}

export async function vetoProposal(id: string, reason: string): Promise<any> {
  return authFetch(`${EXPLORER_BASE}/proposals/${id}/veto`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
