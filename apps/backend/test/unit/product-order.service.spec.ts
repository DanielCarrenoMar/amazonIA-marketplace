import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderStatus, UserRole } from 'dtos';
import { ProductOrderService } from '../../src/product-order/product-order.service';

describe('ProductOrderService', () => {
  const txMock = {
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    productOrder: {
      create: jest.fn(),
      update: jest.fn(),
    },
    orderStatusHistory: {
      create: jest.fn(),
    },
    seller: {
      update: jest.fn(),
    },
  } as any;

  const prismaMock = {
    productOrder: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    orderStatusHistory: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(async (callback: any) => callback(txMock)),
  } as any;

  const service = new ProductOrderService(prismaMock);
  const allStatuses = [
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELED,
    OrderStatus.REFUNDED,
  ] as const;
  const allowedTransitionsByStatus: Record<OrderStatus, readonly OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELED],
    [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.REFUNDED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELED]: [],
    [OrderStatus.REFUNDED]: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback(txMock));
  });

  it('creates order and decrements stock', async () => {
    txMock.product.findUnique
      .mockResolvedValueOnce({ stockAvailable: 10 })
      .mockResolvedValueOnce({ price: 25 });
    txMock.product.update.mockResolvedValue({});
    txMock.productOrder.create.mockResolvedValue({
      id: 'order-1',
      buyerId: 'buyer-1',
      totalAmount: 50,
    });

    await expect(
      service.create('buyer-1', {
        productId: 'product-1',
        quantity: 2,
      } as any),
    ).resolves.toMatchObject({
      id: 'order-1',
      buyerId: 'buyer-1',
      totalAmount: 50,
    });

    expect(txMock.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { stockAvailable: { decrement: 2 } },
    });

    expect(txMock.productOrder.create).toHaveBeenCalledWith({
      data: {
        productId: 'product-1',
        quantity: 2,
        buyerId: 'buyer-1',
        totalAmount: 50,
      },
    });
  });

  it('throws BadRequestException when stock is insufficient', async () => {
    txMock.product.findUnique.mockResolvedValueOnce({ stockAvailable: 1 });

    await expect(
      service.create('buyer-1', {
        productId: 'product-1',
        quantity: 2,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
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

  describe('Update_ChangeStatus', () => {
    const setupOrder = (currentStatus: OrderStatus) => {
      prismaMock.productOrder.findUnique.mockResolvedValue({
        id: 'order-1',
        buyerId: 'owner-user',
        currentStatus,
        product: {},
      });
    };

    it.each([
      [OrderStatus.PENDING, [OrderStatus.PAID, OrderStatus.CANCELED]],
      [OrderStatus.PAID, [OrderStatus.SHIPPED, OrderStatus.REFUNDED]],
      [OrderStatus.SHIPPED, [OrderStatus.DELIVERED]],
      [OrderStatus.DELIVERED, []],
      [OrderStatus.CANCELED, []],
      [OrderStatus.REFUNDED, []],
    ] as Array<[OrderStatus, OrderStatus[]]>)('allows only valid transitions from %s', async (currentStatus, allowedStatuses) => {
      setupOrder(currentStatus);

      for (const nextStatus of allowedStatuses) {
        txMock.productOrder.update.mockResolvedValue({ id: 'order-1', currentStatus: nextStatus });

        await expect(
          service.update(
            'order-1',
            { id: 'owner-user', role: UserRole.BUYER },
            { currentStatus: nextStatus } as any,
          ),
        ).resolves.toMatchObject({ id: 'order-1', currentStatus: nextStatus });
      }
    });

    it.each(
      allStatuses.flatMap((currentStatus) =>
        allStatuses
          .filter((nextStatus) => {
            return currentStatus !== nextStatus && !allowedTransitionsByStatus[currentStatus].includes(nextStatus);
          })
          .map((nextStatus) => [currentStatus, nextStatus]),
      ) as Array<[OrderStatus, OrderStatus]>,
    )('rejects invalid transition %s -> %s', async (currentStatus, nextStatus) => {
      setupOrder(currentStatus);

      await expect(
        service.update(
          'order-1',
          { id: 'owner-user', role: UserRole.BUYER },
          { currentStatus: nextStatus } as any,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
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