import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, UserRole } from 'event-types';
import { OutboxService } from '../outbox/outbox.service';
import { PrismaService } from '../prisma/prisma.service';
import { TelemetryIntegrationService } from '../telemetry-integration/telemetry-integration.service';
import { ProductOrderService } from './product-order.service';

const makeOrder = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'order-uuid',
  buyerId: 'buyer-uuid',
  productId: 'product-uuid',
  quantity: 2,
  totalAmount: { toString: () => '200.00' },
  currentStatus: OrderStatus.PAID,
  product: { sellerId: 'seller-uuid' },
  statusHistory: [],
  ...overrides,
});

describe('ProductOrderService', () => {
  let service: ProductOrderService;
  let prisma: Record<string, jest.Mock>;
  let outbox: { append: jest.Mock };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      productOrder: {
        findUnique: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      } as unknown as jest.Mock,
      orderStatusHistory: { create: jest.fn() } as unknown as jest.Mock,
      product: { update: jest.fn(), findUnique: jest.fn() } as unknown as jest.Mock,
      seller: { update: jest.fn() } as unknown as jest.Mock,
    };

    outbox = { append: jest.fn().mockResolvedValue({ id: 'outbox-uuid' }) };

    const telemetry = {
      getShipmentTelemetry: jest.fn().mockResolvedValue(null),
      getShipmentHistory: jest.fn().mockResolvedValue(null),
      circuitState: 'CLOSED',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductOrderService,
        { provide: PrismaService, useValue: prisma },
        { provide: OutboxService, useValue: outbox },
        { provide: TelemetryIntegrationService, useValue: telemetry },
      ],
    }).compile();

    service = module.get<ProductOrderService>(ProductOrderService);
  });

  describe('update() — outbox atomicity', () => {
    it('inserts outbox event inside the transaction on status change', async () => {
      const order = makeOrder();
      const tx = {
        productOrder: {
          findUnique: jest.fn().mockResolvedValue(order),
          update: jest.fn().mockResolvedValue({ ...order, currentStatus: OrderStatus.SHIPPED }),
          aggregate: jest.fn().mockResolvedValue({ _avg: { sellerRatingValue: null } }),
        },
        orderStatusHistory: { create: jest.fn().mockResolvedValue({}) },
        product: { update: jest.fn() },
        seller: { update: jest.fn() },
      };

      (prisma.productOrder as unknown as { findUnique: jest.Mock }).findUnique
        .mockResolvedValue(order);
      (prisma.$transaction as jest.Mock).mockImplementation((cb: (tx: any) => unknown) => cb(tx));

      await service.update(
        'order-uuid',
        { id: 'seller-uuid', role: UserRole.SELLER },
        { currentStatus: OrderStatus.SHIPPED, trackingNumber: 'TRK123', carrierId: 1 },
      );

      expect(outbox.append).toHaveBeenCalledTimes(1);
      expect(outbox.append).toHaveBeenCalledWith(
        tx,
        'ProductOrder',
        'order-uuid',
        'order.shipped',
        expect.objectContaining({
          orderId: 'order-uuid',
          previousStatus: OrderStatus.PAID,
          newStatus: OrderStatus.SHIPPED,
          changedByUserId: 'seller-uuid',
        }),
      );
    });

    it('passes the transaction client (not prisma) to outbox.append — guaranteeing atomicity', async () => {
      const order = makeOrder();
      let capturedFirstArg: unknown;

      const tx = {
        productOrder: {
          findUnique: jest.fn().mockResolvedValue(order),
          update: jest.fn().mockResolvedValue({ ...order, currentStatus: OrderStatus.SHIPPED }),
          aggregate: jest.fn().mockResolvedValue({ _avg: { sellerRatingValue: null } }),
        },
        orderStatusHistory: { create: jest.fn().mockResolvedValue({}) },
        product: { update: jest.fn() },
        seller: { update: jest.fn() },
      };

      (prisma.productOrder as unknown as { findUnique: jest.Mock }).findUnique
        .mockResolvedValue(order);
      (prisma.$transaction as jest.Mock).mockImplementation((cb: (tx: any) => unknown) => cb(tx));

      outbox.append.mockImplementation((...args: unknown[]) => {
        capturedFirstArg = args[0];
        return Promise.resolve({ id: 'outbox-uuid' });
      });

      await service.update(
        'order-uuid',
        { id: 'seller-uuid', role: UserRole.SELLER },
        { currentStatus: OrderStatus.SHIPPED, trackingNumber: 'TRK123', carrierId: 1 },
      );

      expect(capturedFirstArg).toBe(tx);
      expect(capturedFirstArg).not.toBe(prisma);
    });

    it('does not insert outbox event when status does not change', async () => {
      const order = makeOrder();
      const tx = {
        productOrder: {
          findUnique: jest.fn().mockResolvedValue(order),
          update: jest.fn().mockResolvedValue(order),
          aggregate: jest.fn().mockResolvedValue({ _avg: { sellerRatingValue: null } }),
        },
        orderStatusHistory: { create: jest.fn() },
        product: { update: jest.fn() },
        seller: { update: jest.fn() },
      };

      (prisma.productOrder as unknown as { findUnique: jest.Mock }).findUnique
        .mockResolvedValue(order);
      (prisma.$transaction as jest.Mock).mockImplementation((cb: (tx: any) => unknown) => cb(tx));

      await service.update(
        'order-uuid',
        { id: 'seller-uuid', role: UserRole.ADMIN },
        { orderNotes: 'just a note update' },
      );

      expect(outbox.append).not.toHaveBeenCalled();
    });

    it('includes correct Stream topic in outbox payload for shipment events', async () => {
      const order = makeOrder();
      const tx = {
        productOrder: {
          findUnique: jest.fn().mockResolvedValue(order),
          update: jest.fn().mockResolvedValue({ ...order, currentStatus: OrderStatus.SHIPPED }),
          aggregate: jest.fn().mockResolvedValue({ _avg: { sellerRatingValue: null } }),
        },
        orderStatusHistory: { create: jest.fn().mockResolvedValue({}) },
        product: { update: jest.fn() },
        seller: { update: jest.fn() },
      };

      (prisma.productOrder as unknown as { findUnique: jest.Mock }).findUnique
        .mockResolvedValue(order);
      (prisma.$transaction as jest.Mock).mockImplementation((cb: (tx: any) => unknown) => cb(tx));

      await service.update(
        'order-uuid',
        { id: 'seller-uuid', role: UserRole.SELLER },
        { currentStatus: OrderStatus.SHIPPED, trackingNumber: 'TRK123', carrierId: 1 },
      );

      const payload = outbox.append.mock.calls[0][4] as Record<string, unknown>;
      expect(payload.topic).toBe('iot.shipment.events');
    });

    it('propagates transaction failure and does not commit outbox event', async () => {
      const order = makeOrder();

      (prisma.productOrder as unknown as { findUnique: jest.Mock }).findUnique
        .mockResolvedValue(order);
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('DB connection lost'));

      await expect(
        service.update(
          'order-uuid',
          { id: 'seller-uuid', role: UserRole.SELLER },
          { currentStatus: OrderStatus.SHIPPED, trackingNumber: 'TRK123', carrierId: 1 },
        ),
      ).rejects.toThrow('DB connection lost');
    });

    it('throws NotFoundException when order does not exist', async () => {
      (prisma.productOrder as unknown as { findUnique: jest.Mock }).findUnique
        .mockResolvedValue(null);

      await expect(
        service.update(
          'nonexistent-uuid',
          { id: 'user-uuid', role: UserRole.ADMIN },
          { currentStatus: OrderStatus.SHIPPED, trackingNumber: 'TRK123', carrierId: 1 },
        ),
      ).rejects.toThrow(NotFoundException);

      expect(outbox.append).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException for unauthorized update and does not touch outbox', async () => {
      const order = makeOrder({ buyerId: 'buyer-uuid', product: { sellerId: 'seller-uuid' } });

      (prisma.productOrder as unknown as { findUnique: jest.Mock }).findUnique
        .mockResolvedValue(order);

      await expect(
        service.update(
          'order-uuid',
          { id: 'unrelated-user-uuid', role: UserRole.BUYER },
          { currentStatus: OrderStatus.SHIPPED, trackingNumber: 'TRK123', carrierId: 1 },
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(outbox.append).not.toHaveBeenCalled();
    });
  });
});
