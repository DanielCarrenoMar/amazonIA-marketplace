import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { UserAccountService } from '../../src/user-account/user-account.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { StorageService } from '../../src/storage/storage.service';
import { SpatialService } from '../../src/spatial/spatial.service';
import { ConflictException } from '@nestjs/common';

describe('UserAccountService', () => {
  let service: UserAccountService;

  const mockPrismaService = {
    userAccount: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockStorageService = {
    deleteImage: jest.fn(),
    uploadOptimizedImage: jest.fn(),
  };

  const mockSpatialService = {
    updateUserLocation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAccountService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: SpatialService, useValue: mockSpatialService },
      ],
    }).compile();

    service = module.get<UserAccountService>(UserAccountService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('throws ConflictException if email already exists', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('msg', { code: 'P2002', clientVersion: '1' });
      mockPrismaService.userAccount.create.mockRejectedValue(error);
      await expect(
        service.create({ email: 'test@test.com', password: 'pass', fullName: 'Test', nationalId: '123' })
      ).rejects.toThrow(ConflictException);
    });

    it('creates a user if email does not exist', async () => {
      mockPrismaService.userAccount.findUnique.mockResolvedValue(null);
      mockPrismaService.userAccount.create.mockResolvedValue({ id: 'u1', email: 'test@test.com' });

      const res = await service.create({ email: 'test@test.com', password: 'pass', fullName: 'Test', nationalId: '123' });
      expect(res.id).toBe('u1');
    });
  });
});
