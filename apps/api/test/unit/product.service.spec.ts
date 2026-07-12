import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from 'event-types';
import { ProductService } from '../../src/product/product.service';

describe('ProductService — ownership checks', () => {
  // ── Prisma mock ────────────────────────────────────────────────────────────
  const prismaMock = {
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    productOrder: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
    $executeRaw: jest.fn(),
  } as any;

  // StorageService mock — irrelevant for these tests
  const storageMock = {
    deleteImage: jest.fn(),
    uploadOptimizedImage: jest.fn(),
  } as any;

  const service = new ProductService(prismaMock, storageMock, { emit: jest.fn() } as any);

  // ── Fixtures ───────────────────────────────────────────────────────────────
  const OWNER_ID   = 'seller-owner-uuid';
  const OTHER_ID   = 'seller-other-uuid';
  const ADMIN_ID   = 'admin-uuid';
  const PRODUCT_ID = 'product-uuid';

  const ownerUser = { id: OWNER_ID, role: UserRole.SELLER };
  const otherUser = { id: OTHER_ID, role: UserRole.SELLER };
  const adminUser = { id: ADMIN_ID, role: UserRole.ADMIN };

  const existingProduct = {
    id: PRODUCT_ID,
    sellerId: OWNER_ID,
    imageUrl: null,
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ── update() ───────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('allows the product owner (SELLER) to update', async () => {
      prismaMock.product.findUnique.mockResolvedValue(existingProduct);
      prismaMock.product.update.mockResolvedValue({ ...existingProduct, name: 'Updated' });

      await expect(
        service.update(PRODUCT_ID, { name: 'Updated' } as any, ownerUser),
      ).resolves.toMatchObject({ name: 'Updated' });

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: PRODUCT_ID },
        data: { name: 'Updated' },
      });
    });

    it('allows an ADMIN to update any product regardless of ownership', async () => {
      prismaMock.product.findUnique.mockResolvedValue(existingProduct);
      prismaMock.product.update.mockResolvedValue({ ...existingProduct, price: 99 });

      await expect(
        service.update(PRODUCT_ID, { price: 99 } as any, adminUser),
      ).resolves.toMatchObject({ price: 99 });
    });

    it('throws ForbiddenException when a SELLER tries to update a product they do not own', async () => {
      prismaMock.product.findUnique.mockResolvedValue(existingProduct);

      await expect(
        service.update(PRODUCT_ID, { price: 1 } as any, otherUser),
      ).rejects.toBeInstanceOf(ForbiddenException);

      // Must NOT reach the database write
      expect(prismaMock.product.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException before the ownership check when the product does not exist', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', {} as any, ownerUser),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ── remove() ───────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('allows the product owner (SELLER) to delete their own product', async () => {
      prismaMock.product.findUnique.mockResolvedValue(existingProduct);
      prismaMock.productOrder.count.mockResolvedValue(0); // no active orders
      prismaMock.product.delete.mockResolvedValue(existingProduct);

      await expect(
        service.remove(PRODUCT_ID, ownerUser),
      ).resolves.toMatchObject({ id: PRODUCT_ID });

      expect(prismaMock.product.delete).toHaveBeenCalledWith({ where: { id: PRODUCT_ID } });
    });

    it('allows an ADMIN to delete any product regardless of ownership', async () => {
      prismaMock.product.findUnique.mockResolvedValue(existingProduct);
      prismaMock.productOrder.count.mockResolvedValue(0);
      prismaMock.product.delete.mockResolvedValue(existingProduct);

      await expect(
        service.remove(PRODUCT_ID, adminUser),
      ).resolves.toMatchObject({ id: PRODUCT_ID });
    });

    it('throws ForbiddenException when a SELLER tries to delete a product they do not own', async () => {
      prismaMock.product.findUnique.mockResolvedValue(existingProduct);

      await expect(
        service.remove(PRODUCT_ID, otherUser),
      ).rejects.toBeInstanceOf(ForbiddenException);

      // Must NOT reach the database write
      expect(prismaMock.product.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException before the ownership check when the product does not exist', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent-id', ownerUser),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
