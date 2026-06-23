import { NotFoundException } from '@nestjs/common';
import { ProductRatingService } from '../../src/product-rating/product-rating.service';

describe('ProductRatingService', () => {
  const txMock = {
    productRating: {
      aggregate: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      update: jest.fn(),
    },
    seller: {
      update: jest.fn(),
    },
  } as any;

  const prismaMock = {
    productRating: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (callback: any) => callback(txMock)),
  } as any;

  const eventEmitterMock = {
    emit: jest.fn(),
  } as any;

  const service = new ProductRatingService(prismaMock, eventEmitterMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws NotFoundException when user updates missing rating', async () => {
    prismaMock.productRating.findUnique.mockResolvedValue(null);

    await expect(
      service.update('product-1', 'other-user', {} as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when user deletes missing rating', async () => {
    prismaMock.productRating.findUnique.mockResolvedValue(null);

    await expect(
      service.remove('product-1', 'other-user'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates rating when user owns rating', async () => {
    prismaMock.productRating.findUnique.mockResolvedValue({
      productId: 'product-1',
      userAccountId: 'owner-user',
    });
    txMock.productRating.aggregate
      .mockResolvedValueOnce({ _avg: { ratingValue: 4 }, _count: { ratingValue: 1 } })
      .mockResolvedValueOnce({ _avg: { ratingValue: 4 }, _count: { ratingValue: 1 } });
    txMock.productRating.update.mockResolvedValue({
      productId: 'product-1',
      userAccountId: 'owner-user',
      ratingValue: 5,
    });
    txMock.product.update.mockResolvedValue({ sellerId: 'seller-1' });
    txMock.seller.update.mockResolvedValue({ id: 'seller-1' });

    await expect(
      service.update('product-1', 'owner-user', { ratingValue: 5 } as any),
    ).resolves.toMatchObject({
      productId: 'product-1',
      userAccountId: 'owner-user',
      ratingValue: 5,
    });
  });

  it('deletes rating when user owns rating', async () => {
    prismaMock.productRating.findUnique.mockResolvedValue({
      productId: 'product-1',
      userAccountId: 'owner-user',
    });
    txMock.productRating.aggregate
      .mockResolvedValueOnce({ _avg: { ratingValue: 4 }, _count: { ratingValue: 1 } })
      .mockResolvedValueOnce({ _avg: { ratingValue: 4 }, _count: { ratingValue: 1 } });
    txMock.productRating.delete.mockResolvedValue({
      productId: 'product-1',
      userAccountId: 'owner-user',
    });
    txMock.product.update.mockResolvedValue({ sellerId: 'seller-1' });
    txMock.seller.update.mockResolvedValue({ id: 'seller-1' });

    await expect(
      service.remove('product-1', 'owner-user'),
    ).resolves.toMatchObject({
      productId: 'product-1',
      userAccountId: 'owner-user',
    });
  });
});