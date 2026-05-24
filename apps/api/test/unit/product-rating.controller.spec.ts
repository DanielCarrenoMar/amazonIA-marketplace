import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductRatingController } from '../../src/product-rating/product-rating.controller';
import { ProductRatingService } from '../../src/product-rating/product-rating.service';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { GUARDS_METADATA } from '@nestjs/common/constants';

describe('ProductRatingController', () => {
  let controller: ProductRatingController;

  const mockProductRatingService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductRatingController],
      providers: [
        { provide: ProductRatingService, useValue: mockProductRatingService },
      ],
    }).compile();

    controller = module.get<ProductRatingController>(ProductRatingController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('protects create, update and remove with JwtAuthGuard', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ProductRatingController.prototype.create)).toEqual([JwtAuthGuard]);
    expect(Reflect.getMetadata(GUARDS_METADATA, ProductRatingController.prototype.update)).toEqual([JwtAuthGuard]);
    expect(Reflect.getMetadata(GUARDS_METADATA, ProductRatingController.prototype.remove)).toEqual([JwtAuthGuard]);
  });

  it('delegates to service methods', async () => {
    const req = { user: { id: 'u1' } };
    const dto = { ratingValue: 5, productId: 'p1' };
    
    await controller.create(req, dto);
    expect(mockProductRatingService.create).toHaveBeenCalledWith('u1', dto);

    await controller.remove('p1', req);
    expect(mockProductRatingService.remove).toHaveBeenCalledWith('p1', 'u1');
  });
});
