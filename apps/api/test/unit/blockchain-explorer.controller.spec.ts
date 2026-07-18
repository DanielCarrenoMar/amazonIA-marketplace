import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BlockchainExplorerController } from '../../src/blockchain/blockchain-explorer.controller';
import { ListProposalsDto } from 'event-types';

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

  const prismaMock = {} as any;

  const controller = new BlockchainExplorerController(serviceMock, prismaMock);

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
      const id = '00000000-0000-4000-8000-000000000000';

      const result = await controller.findProposal(id);

      expect(serviceMock.findProposal).toHaveBeenCalledWith(id);
      expect(result).toBeNull();
    });
  });

  // ── DTO validation (REQ-3: 3-value status filter) ───────────────────────
  // The controller spec mocks the service, so the global ValidationPipe is
  // never exercised in the delegation tests above. These cases validate the
  // DTO directly via class-validator, which is what the ValidationPipe does
  // at request time. This guards against the regression where
  // ListProposalsDto used @IsEnum(ProposalStatusEnum) (5-value) instead of
  // a strict 3-value filter.
  describe('ListProposalsDto validation (REQ-3: 3-value status filter)', () => {
    it.each(['PENDING', 'CONFIRMED', 'VETOED'])(
      'accepts %s as a valid status',
      async (status) => {
        const dto = plainToInstance(ListProposalsDto, { status });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      },
    );

    it.each(['APPROVED', 'FAILED', 'foo', 'pending', 'PENDING '])(
      'rejects %j as an invalid status',
      async (status) => {
        const dto = plainToInstance(ListProposalsDto, { status });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const statusError = errors.find((e) => e.property === 'status');
        expect(statusError).toBeDefined();
        expect(statusError?.constraints?.isIn).toBeDefined();
        expect(statusError?.constraints?.isIn).toContain(
          'status must be one of: PENDING, CONFIRMED, VETOED',
        );
      },
    );

    it('accepts undefined status (filter is optional)', async () => {
      const dto = plainToInstance(ListProposalsDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts non-status query params (page, limit) without status', async () => {
      const dto = plainToInstance(ListProposalsDto, { page: 1, limit: 20 });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
