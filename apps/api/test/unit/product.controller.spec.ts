import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UserRole } from 'event-types';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/auth/guards/roles.guard';
import { ROLES_KEY } from '../../src/auth/decorators/roles.decorator';
import { ProductController } from '../../src/product/product.controller';

describe('ProductController — route guards & ownership delegation', () => {
  const productServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findNearby: jest.fn(),
    findBySeller: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    uploadImage: jest.fn(),
  } as any;

  const controller = new ProductController(productServiceMock);

  beforeEach(() => jest.clearAllMocks());

  // ── PATCH :id ──────────────────────────────────────────────────────────────
  describe('PATCH :id', () => {
    it('is protected by JwtAuthGuard and RolesGuard', () => {
      expect(
        Reflect.getMetadata(GUARDS_METADATA, ProductController.prototype.update),
      ).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
    });

    it('allows SELLER and ADMIN roles', () => {
      expect(
        Reflect.getMetadata(ROLES_KEY, ProductController.prototype.update),
      ).toEqual(expect.arrayContaining([UserRole.SELLER, UserRole.ADMIN]));
    });

    it('forwards req.user to the service', async () => {
      const reqUser = { id: 'seller-1', role: UserRole.SELLER };
      const dto = { price: 50 } as any;
      productServiceMock.update.mockResolvedValue({ id: 'p-1', price: 50 });

      await controller.update('p-1', dto, { user: reqUser });

      expect(productServiceMock.update).toHaveBeenCalledWith('p-1', dto, reqUser);
    });
  });

  // ── DELETE :id ─────────────────────────────────────────────────────────────
  describe('DELETE :id', () => {
    it('is protected by JwtAuthGuard and RolesGuard', () => {
      expect(
        Reflect.getMetadata(GUARDS_METADATA, ProductController.prototype.remove),
      ).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
    });

    it('allows SELLER and ADMIN roles (not ADMIN-only)', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, ProductController.prototype.remove);
      expect(roles).toEqual(expect.arrayContaining([UserRole.SELLER, UserRole.ADMIN]));
    });

    it('forwards req.user to the service', async () => {
      const reqUser = { id: 'seller-1', role: UserRole.SELLER };
      productServiceMock.remove.mockResolvedValue({ id: 'p-1' });

      await controller.remove('p-1', { user: reqUser });

      expect(productServiceMock.remove).toHaveBeenCalledWith('p-1', reqUser);
    });
  });
});
