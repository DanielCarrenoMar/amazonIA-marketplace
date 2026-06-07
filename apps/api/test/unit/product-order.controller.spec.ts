import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UserRole } from 'event-types';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/auth/guards/roles.guard';
import { ROLES_KEY } from '../../src/auth/decorators/roles.decorator';
import { ProductOrderController } from '../../src/product-order/product-order.controller';

describe('ProductOrderController', () => {
  const productOrderServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByBuyer: jest.fn(),
    findOneForBuyer: jest.fn(),
    findOne: jest.fn(),
    findOneWithTelemetry: jest.fn(),
    getTimeline: jest.fn(),
    findHistory: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as any;

  const controller = new ProductOrderController(productOrderServiceMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('locks findAll to jwt plus admin role', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, ProductOrderController.prototype.findAll),
    ).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
    expect(Reflect.getMetadata(ROLES_KEY, ProductOrderController.prototype.findAll)).toEqual([
      UserRole.ADMIN,
    ]);
  });

  it('locks findOne, findHistory, and getTimeline to jwt only', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ProductOrderController.prototype.findOne)).toEqual([
      JwtAuthGuard,
    ]);
    expect(Reflect.getMetadata(GUARDS_METADATA, ProductOrderController.prototype.findHistory)).toEqual([
      JwtAuthGuard,
    ]);
    expect(Reflect.getMetadata(GUARDS_METADATA, ProductOrderController.prototype.getTimeline)).toEqual([
      JwtAuthGuard,
    ]);
  });

  it('delegates findOne, findHistory, and getTimeline to service', async () => {
    productOrderServiceMock.findOneWithTelemetry.mockResolvedValue({ id: 'order-1', telemetry: null });
    productOrderServiceMock.findHistory.mockResolvedValue([{ id: 'hist-1' }]);
    productOrderServiceMock.getTimeline.mockResolvedValue({ orderId: 'order-1', items: [] });

    const req = { user: { id: 'user-1', role: UserRole.BUYER } };
    await expect(controller.findOne('order-1', req)).resolves.toEqual({ id: 'order-1', telemetry: null });
    await expect(controller.findHistory('order-1', req)).resolves.toEqual([{ id: 'hist-1' }]);
    await expect(controller.getTimeline('order-1', req)).resolves.toEqual({ orderId: 'order-1', items: [] });
  });
});