import { Test, TestingModule } from '@nestjs/testing';
import { SellerService } from '../../src/seller/seller.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from 'event-types';

describe('SellerService', () => {
  let service: SellerService;

  const mockPrismaService = {
    seller: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SellerService>(SellerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('throws ForbiddenException if user is not ADMIN and not the seller', async () => {
      mockPrismaService.seller.findUnique.mockResolvedValue({ id: 'seller-1' });

      await expect(
        service.update('seller-1', { id: 'other-user', role: UserRole.SELLER }, { description: 'test' })
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows update if user is ADMIN', async () => {
      mockPrismaService.seller.findUnique.mockResolvedValue({ id: 'seller-1' });
      mockPrismaService.seller.update.mockResolvedValue({ id: 'seller-1', description: 'test' });

      const res = await service.update('seller-1', { id: 'admin-1', role: UserRole.ADMIN }, { description: 'test' });
      expect(res.description).toBe('test');
    });

    it('allows update if user is the seller', async () => {
      mockPrismaService.seller.findUnique.mockResolvedValue({ id: 'seller-1' });
      mockPrismaService.seller.update.mockResolvedValue({ id: 'seller-1', description: 'test' });

      const res = await service.update('seller-1', { id: 'seller-1', role: UserRole.SELLER }, { description: 'test' });
      expect(res.description).toBe('test');
    });
  });

  describe('remove', () => {
    it('throws ForbiddenException if user is not ADMIN and not the seller', async () => {
      mockPrismaService.seller.findUnique.mockResolvedValue({ id: 'seller-1' });

      await expect(
        service.remove('seller-1', { id: 'other-user', role: UserRole.SELLER })
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
