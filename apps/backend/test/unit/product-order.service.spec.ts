import { ForbiddenException } from '@nestjs/common';
import { UserRole } from 'dtos';
import { ProductOrderService } from '../../src/product-order/product-order.service';

describe('ProductOrderService', () => {
  const prismaMock = {
    productOrder: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  const service = new ProductOrderService(prismaMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws ForbiddenException when non-owner non-admin non-seller updates order', async () => {
    prismaMock.productOrder.findUnique.mockResolvedValue({
      id: 'order-1',
      buyerId: 'owner-user',
      currentStatus: 'PENDING',
    });

    await expect(
      service.update(
        'order-1',
        { id: 'other-user', role: UserRole.BUYER },
        {} as any,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws ForbiddenException when non-owner non-admin deletes order', async () => {
    prismaMock.productOrder.findUnique.mockResolvedValue({
      id: 'order-1',
      buyerId: 'owner-user',
    });

    await expect(
      service.remove('order-1', { id: 'other-user', role: UserRole.BUYER }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});