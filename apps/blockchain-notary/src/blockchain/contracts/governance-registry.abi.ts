// =============================================================================
// GovernanceRegistry ABI — Extraído de artifacts/contracts/GovernanceRegistry.sol
// Generado por Hardhat al compilar. Contiene todas las funciones y eventos.
// =============================================================================

export const GOVERNANCE_REGISTRY_ABI = [
  // ── Constructor ─────────────────────────────────────────────────────────
  { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },

  // ── Events ──────────────────────────────────────────────────────────────
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'oldElder', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newElder', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'EldershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'string', name: 'proposalId', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'votesFor', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'votesAgainst', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'ProposalApproved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'string', name: 'proposalId', type: 'string' },
      { indexed: false, internalType: 'string', name: 'contentHash', type: 'string' },
      { indexed: false, internalType: 'string', name: 'proposerUserId', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'deadline', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'ProposalCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'string', name: 'proposalId', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'ProposalFinalized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'string', name: 'proposalId', type: 'string' },
      { indexed: false, internalType: 'string', name: 'reason', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'ProposalVetoed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: false, internalType: 'string', name: 'userId', type: 'string' },
      { indexed: false, internalType: 'uint8', name: 'role', type: 'uint8' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'RoleAssigned',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'string', name: 'proposalId', type: 'string' },
      { indexed: true, internalType: 'address', name: 'voter', type: 'address' },
      { indexed: false, internalType: 'string', name: 'voterUserId', type: 'string' },
      { indexed: false, internalType: 'bool', name: 'inFavor', type: 'bool' },
      { indexed: false, internalType: 'uint256', name: 'weight', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'VoteCast',
    type: 'event',
  },

  // ── Write functions ──────────────────────────────────────────────────────
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'string', name: 'userId', type: 'string' },
      { internalType: 'uint8', name: 'role', type: 'uint8' },
    ],
    name: 'assignRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'proposalId', type: 'string' },
      { internalType: 'string', name: 'contentHash', type: 'string' },
      { internalType: 'string', name: 'proposerUserId', type: 'string' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
    ],
    name: 'createProposal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'proposalId', type: 'string' }],
    name: 'finalizeProposal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newElder', type: 'address' }],
    name: 'transferEldership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'proposalId', type: 'string' },
      { internalType: 'string', name: 'reason', type: 'string' },
    ],
    name: 'veto',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'proposalId', type: 'string' },
      { internalType: 'bool', name: 'inFavor', type: 'bool' },
    ],
    name: 'vote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // ── View functions (sin gas) ─────────────────────────────────────────────
  {
    inputs: [{ internalType: 'string', name: 'proposalId', type: 'string' }],
    name: 'getProposal',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'proposalId', type: 'string' },
          { internalType: 'string', name: 'contentHash', type: 'string' },
          { internalType: 'string', name: 'proposerUserId', type: 'string' },
          { internalType: 'uint256', name: 'votesFor', type: 'uint256' },
          { internalType: 'uint256', name: 'votesAgainst', type: 'uint256' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
          { internalType: 'uint8', name: 'status', type: 'uint8' },
          { internalType: 'bool', name: 'exists', type: 'bool' },
        ],
        internalType: 'struct GovernanceRegistry.Proposal',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'getRole',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'elder',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'elderVoteWeight',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'quorumThreshold',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalMembers',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalProposals',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Enumeración de roles del contrato (coincide con enum Role en Solidity)
export const ContractRole = {
  NONE: 0,
  MEMBER: 1,
  ELDER: 2,
} as const;

// Enumeración de estados de propuesta (coincide con enum ProposalStatus en Solidity)
export const ContractProposalStatus = {
  PENDING: 0,
  APPROVED: 1,
  VETOED: 2,
  CONFIRMED: 3,
  FAILED: 4,
} as const;
