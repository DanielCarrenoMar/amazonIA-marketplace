import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderStatus, UserRole } from 'event-types';
import { ProductOrderService } from '../../src/product-order/product-order.service';

describe('ProductOrderService', () => {
  const txMock = {
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    productOrder: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

  const outboxMock = { append: jest.fn() } as any;

  const service = new ProductOrderService(prismaMock, outboxMock);
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
    jest.resetAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback(txMock));
  });

  it('creates order and decrements stock', async () => {
    txMock.product.findUnique.mockResolvedValue({ stockAvailable: 10, price: 25, sellerId: 'seller-1' });
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
        currentStatus: OrderStatus.PENDING,
      },
    });
  });

  it('throws BadRequestException when stock is insufficient', async () => {
    txMock.product.findUnique.mockResolvedValueOnce({ stockAvailable: 1, sellerId: 'seller-1' });

    await expect(
      service.create('buyer-1', {
        productId: 'product-1',
        quantity: 2,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException when seller tries to buy their own product', async () => {
    txMock.product.findUnique.mockResolvedValueOnce({ stockAvailable: 10, price: 25, sellerId: 'seller-1' });

    await expect(
      service.create('seller-1', {
        productId: 'product-1',
        quantity: 1,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Must NOT decrement stock or create an order
    expect(txMock.product.update).not.toHaveBeenCalled();
    expect(txMock.productOrder.create).not.toHaveBeenCalled();
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
      const order = {
        id: 'order-1',
        buyerId: 'owner-user',
        productId: 'product-1',
        quantity: 1,
        totalAmount: { toString: () => '100.00' },
        currentStatus,
        product: { sellerId: 'seller-1' },
      };
      prismaMock.productOrder.findUnique.mockResolvedValue(order);
      txMock.productOrder.findUnique.mockResolvedValue(order);
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
      include: { changedByUser: { omit: { passwordHash: true } } },
    });
  });
});