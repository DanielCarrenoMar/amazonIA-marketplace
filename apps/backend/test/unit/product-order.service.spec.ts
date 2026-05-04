import { ForbiddenException } from '@nestjs/common';
import { UserRole } from 'dtos';
import { ProductOrderService } from '../../src/product-order/product-order.service';

describe('ProductOrderService', () => {
  const prismaMock = {
    productOrder: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    orderStatusHistory: {
      findMany: jest.fn(),
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

  it('returns order when findOne gets existing order', async () => {
    prismaMock.productOrder.findUnique.mockResolvedValue({
      id: 'order-1',
      buyerId: 'owner-user',
      currentStatus: 'PENDING',
    });

    await expect(service.findOne('order-1')).resolves.toMatchObject({
      id: 'order-1',
      buyerId: 'owner-user',
    });
  });

  it('loads order history after verifying order exists', async () => {
    prismaMock.productOrder.findUnique.mockResolvedValue({
      id: 'order-1',
      buyerId: 'owner-user',
      currentStatus: 'PENDING',
    });
    prismaMock.orderStatusHistory.findMany.mockResolvedValue([{ id: 'history-1' }]);

    await expect(service.findHistory('order-1')).resolves.toEqual([
      { id: 'history-1' },
    ]);

    expect(prismaMock.orderStatusHistory.findMany).toHaveBeenCalledWith({
      where: { orderId: 'order-1' },
      orderBy: { createdAt: 'asc' },
      include: { changedByUser: true },
    });
  });
});