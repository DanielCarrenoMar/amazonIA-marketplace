import 'reflect-metadata';
import { BlockchainExplorerController } from '../../src/blockchain/blockchain-explorer.controller';

// =============================================================================
// BlockchainExplorerController — route metadata + delegation tests.
// Verifies (1) service is called with the right args, (2) route paths match
// the frontend contract, (3) no auth guards are present (the explorer is
// public per the team guide).
// =============================================================================

describe('BlockchainExplorerController', () => {
  const serviceMock = {
    findProposals: jest.fn(),
    findProposal: jest.fn(),
    findMembers: jest.fn(),
  } as any;

  const controller = new BlockchainExplorerController(serviceMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Route paths ──────────────────────────────────────────────────────────
  describe('route paths', () => {
    it('mounts the controller at /api/v1/blockchain/explorer', () => {
      expect(
        Reflect.getMetadata('path', BlockchainExplorerController),
      ).toBe('api/v1/blockchain/explorer');
    });

    it('maps GET proposals', () => {
      const path = Reflect.getMetadata(
        'path',
        BlockchainExplorerController.prototype.findProposals,
      );
      const method = Reflect.getMetadata(
        'method',
        BlockchainExplorerController.prototype.findProposals,
      );
      expect(path).toBe('proposals');
      expect(method).toBe(0); // RequestMethod.GET
    });

    it('maps GET proposals/:id', () => {
      const path = Reflect.getMetadata(
        'path',
        BlockchainExplorerController.prototype.findProposal,
      );
      const method = Reflect.getMetadata(
        'method',
        BlockchainExplorerController.prototype.findProposal,
      );
      expect(path).toBe('proposals/:id');
      expect(method).toBe(0); // RequestMethod.GET
    });

    it('maps GET members', () => {
      const path = Reflect.getMetadata(
        'path',
        BlockchainExplorerController.prototype.findMembers,
      );
      const method = Reflect.getMetadata(
        'method',
        BlockchainExplorerController.prototype.findMembers,
      );
      expect(path).toBe('members');
      expect(method).toBe(0); // RequestMethod.GET
    });
  });

  // ── No guards ────────────────────────────────────────────────────────────
  describe('public access (no guards)', () => {
    it('does not declare any auth guard on findProposals', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        BlockchainExplorerController.prototype.findProposals,
      );
      expect(guards).toBeUndefined();
    });

    it('does not declare any auth guard on findProposal', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        BlockchainExplorerController.prototype.findProposal,
      );
      expect(guards).toBeUndefined();
    });

    it('does not declare any auth guard on findMembers', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        BlockchainExplorerController.prototype.findMembers,
      );
      expect(guards).toBeUndefined();
    });
  });

  // ── Delegation ───────────────────────────────────────────────────────────
  describe('service delegation', () => {
    it('forwards the status query filter to findProposals', async () => {
      serviceMock.findProposals.mockResolvedValue([]);
      const dto = { status: 'PENDING', page: 1, limit: 10 } as any;

      const result = await controller.findProposals(dto);

      expect(serviceMock.findProposals).toHaveBeenCalledWith({
        status: 'PENDING',
      });
      expect(result).toEqual([]);
    });

    it('forwards undefined status when the query has none', async () => {
      serviceMock.findProposals.mockResolvedValue([]);

      await controller.findProposals({} as any);

      expect(serviceMock.findProposals).toHaveBeenCalledWith({
        status: undefined,
      });
    });

    it('forwards params.id to findProposal and returns null on miss', async () => {
      serviceMock.findProposal.mockResolvedValue(null);
      const params = { id: '00000000-0000-4000-8000-000000000000' };

      const result = await controller.findProposal(params);

      expect(serviceMock.findProposal).toHaveBeenCalledWith(params.id);
      expect(result).toBeNull();
    });
  });
});
