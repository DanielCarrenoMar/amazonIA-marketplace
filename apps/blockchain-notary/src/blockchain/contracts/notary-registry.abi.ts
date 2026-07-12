// =============================================================================
// NotaryRegistry ABI — Exportado de Hardhat/Foundry
// Solo incluimos las funciones que el microservicio necesita llamar
// =============================================================================

export const NOTARY_REGISTRY_ABI = [
  // registerTransaction
  {
    inputs: [
      { name: '_orderId', type: 'string' },
      { name: '_amount', type: 'uint256' },
      { name: '_paymentMethod', type: 'string' },
      { name: '_productHash', type: 'string' },
      { name: '_buyerId', type: 'string' },
      { name: '_sellerId', type: 'string' },
    ],
    name: 'registerTransaction',
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // getRecord
  {
    inputs: [{ name: '_orderId', type: 'string' }],
    name: 'getRecord',
    outputs: [
      {
        components: [
          { name: 'orderId', type: 'string' },
          { name: 'productHash', type: 'string' },
          { name: 'paymentMethod', type: 'string' },
          { name: 'amount', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'exists', type: 'bool' },
        ],
        name: 'record',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // recordExists
  {
    inputs: [{ name: '_orderId', type: 'string' }],
    name: 'recordExists',
    outputs: [{ name: 'exists', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  // totalRecords
  {
    inputs: [],
    name: 'totalRecords',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // owner
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Event: TransactionRegistered
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'orderId', type: 'string' },
      { indexed: false, name: 'productHash', type: 'string' },
      { indexed: false, name: 'paymentMethod', type: 'string' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'TransactionRegistered',
    type: 'event',
  },
] as const;
