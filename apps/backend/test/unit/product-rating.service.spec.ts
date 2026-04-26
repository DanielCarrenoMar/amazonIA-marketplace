import { ForbiddenException } from '@nestjs/common';
import { ProductRatingService } from '../../src/product-rating/product-rating.service';

describe('ProductRatingService', () => {
  const prismaMock = {
    productRating: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  const service = new ProductRatingService(prismaMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws ForbiddenException when user updates rating owned by another user', async () => {
    prismaMock.productRating.findFirst.mockResolvedValue({
      userAccountId: 'owner-user',
    });

    await expect(
      service.update('product-1', 'other-user', {} as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws ForbiddenException when user deletes rating owned by another user', async () => {
    prismaMock.productRating.findFirst.mockResolvedValue({
      userAccountId: 'owner-user',
    });

    await expect(
      service.remove('product-1', 'other-user'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});