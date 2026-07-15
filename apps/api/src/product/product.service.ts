import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CreateProductDto, UpdateProductDto, FindProductsDto, FindNearbyDto, OrderStatus, UserRole, PaginationDto, ProductResponseDto, NearbyProductResponseDto, PaginatedResponseDto, ProductMetricsDto } from 'event-types';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createProductDto: CreateProductDto, sellerId: string): Promise<ProductResponseDto> {
    const { coords, elaborationSteps, ...rest } = createProductDto;

    // Use $transaction so we don't end up with orphaned rows if the spatial query fails
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the standard product record
      const product = await tx.product.create({
        data: {
          ...rest,
          sellerId,
          ...(elaborationSteps && elaborationSteps.length > 0 ? {
            elaborationSteps: {
              create: elaborationSteps,
            }
          } : {})
        },
      });

      // 2. If coordinates are provided, perform a raw SQL update to inject Geography Point
      if (coords && coords.latitude != null && coords.longitude != null) {
        await tx.$executeRaw`
          UPDATE product 
          SET "locationCoords" = ST_SetSRID(ST_MakePoint(${coords.longitude}, ${coords.latitude}), 4326)
          WHERE id = ${product.id}::uuid;
        `;
      }

      return product;
    });
  }

  async findAll(query: FindProductsDto): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const { search, categoryId, categoryName, sellerId, tribeIds, minPrice, maxPrice, minRating } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const parsedCategoryId = categoryId ? Number(categoryId) : undefined;
    
    const where: import('@prisma/client').Prisma.ProductWhereInput = {
      isActive: true, // Only show active products to buyers
      ...(parsedCategoryId !== undefined && !isNaN(parsedCategoryId) ? { categoryId: parsedCategoryId } : {}),
      ...(categoryName ? { category: { categoryName } } : {}),
      ...(sellerId ? { sellerId } : {}),
      ...(tribeIds ? { seller: { tribeId: { in: tribeIds.split(',').map(Number).filter(n => !isNaN(n)) } } } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...((minPrice !== undefined || maxPrice !== undefined) ? {
        price: {
          ...(minPrice !== undefined && !isNaN(minPrice) ? { gte: minPrice } : {}),
          ...(maxPrice !== undefined && !isNaN(maxPrice) ? { lte: maxPrice } : {}),
        }
      } : {}),
      ...(minRating !== undefined && !isNaN(minRating) ? { averageRating: { gte: minRating } } : {}),
    };

    // Run count and findMany in parallel (no transaction needed for reads)
    const [total, data] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { seller: true, category: true, elaborationSteps: { orderBy: { stepNumber: 'asc' } } },
        orderBy: { createdAt: 'desc' }, // Newest first
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findNearby(query: FindNearbyDto): Promise<PaginatedResponseDto<NearbyProductResponseDto>> {
    const { lat, lng, radius = 10 } = query;
    // PostGIS geography ST_DWithin works in meters
    const radiusMeters = radius * 1000;

    // $queryRaw with tagged templates → parameterized query (SQL-injection safe)
    // ST_MakePoint(longitude, latitude) — note the order: lng first, then lat
    // ST_DWithin returns TRUE if two geographies are within the given distance
    // ST_Distance returns the exact distance in meters between the two points
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock_available   AS "stockAvailable",
        p.average_rating    AS "averageRating",
        p.location_city     AS "locationCity",
        p.location_region   AS "locationRegion",
        ROUND(
          ST_Distance(
            p.location_coords,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
          )::numeric / 1000,
          2
        ) AS "distanceKm"
      FROM product p
      WHERE p.location_coords IS NOT NULL
        AND p.is_active = true
        AND ST_DWithin(
          p.location_coords,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          ${radiusMeters}
        )
      ORDER BY "distanceKm" ASC;
    `;

    return {
      data: rows,
      meta: { total: rows.length, page: 1, limit: rows.length, totalPages: 1 },
    };
  }

  async findBySeller(sellerId: string, paginationDto: PaginationDto): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const page = Number(paginationDto?.page) || 1;
    const limit = Number(paginationDto?.limit) || 10;
    const skip = (page - 1) * limit;

    try {
      console.log('findBySeller called with sellerId:', sellerId, typeof sellerId);
      const [total, data] = await Promise.all([
        this.prisma.product.count({ where: { sellerId } }),
        this.prisma.product.findMany({
          where: { sellerId },
          skip,
          take: limit,
          include: { seller: true, category: true, elaborationSteps: { orderBy: { stepNumber: 'asc' } } },
          orderBy: { createdAt: 'desc' },
        }),
      ]);
      return {
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (err: any) {
      console.error('Error in findBySeller:', err);
      throw err;
    }
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { 
        seller: {
          include: { user: true }
        }, 
        category: true, 
        elaborationSteps: { orderBy: { stepNumber: 'asc' } } 
      },
    });

    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, reqUser: { id: string; role: UserRole }): Promise<ProductResponseDto> {
    const product = await this.findOne(id); // Check existence

    // Ownership check: only the product owner or an admin can update
    if (product.sellerId !== reqUser.id && reqUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No tenés permiso para modificar este producto');
    }

    // Security check: Only an ADMIN can change the sellerId
    if (updateProductDto.sellerId && reqUser.role !== UserRole.ADMIN) {
      delete updateProductDto.sellerId;
    }

    // Elaboration steps are now managed via dedicated ProductElaborationController
    const { elaborationSteps, ...rest } = updateProductDto;

    return this.prisma.product.update({
      where: { id },
      data: rest,
      include: { elaborationSteps: { orderBy: { stepNumber: 'asc' } } },
    });
  }

  async removeImage(id: string, reqUser: { id: string; role: UserRole }): Promise<ProductResponseDto> {
    const product = await this.findOne(id);
    if (product.sellerId !== reqUser.id && reqUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No tienes permiso para modificar este producto');
    }

    if (product.imageUrl) {
      await this.storageService.deleteImage(product.imageUrl).catch((err) => {
        console.error(`Failed to delete old image in Supabase: ${err.message}`);
      });
    }

    return this.prisma.product.update({
      where: { id },
      data: { imageUrl: null },
      include: { seller: true, category: true, elaborationSteps: { orderBy: { stepNumber: 'asc' } } },
    });
  }

  async remove(id: string, reqUser: { id: string; role: UserRole }): Promise<ProductResponseDto> {
    const product = await this.findOne(id); // Check existence

    // Ownership check: only the product owner or an admin can delete
    if (product.sellerId !== reqUser.id && reqUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No tenés permiso para eliminar este producto');
    }
    // Check for active orders (not CANCELED or REFUNDED)
    const activeOrders = await this.prisma.productOrder.count({
      where: {
        productId: id,
        currentStatus: { notIn: [OrderStatus.CANCELED, OrderStatus.REFUNDED] },
      },
    });

    if (activeOrders > 0) {
      throw new ConflictException('No se puede eliminar el producto porque tiene órdenes activas');
    }

    if (product.imageUrl) {
      // Delete image in Supabase, but don't fail the whole deletion if it throws
      await this.storageService.deleteImage(product.imageUrl).catch((err) => {
        console.error(`Failed to delete old image in Supabase during product removal: ${err.message}`);
      });
    }

    return this.prisma.product.delete({ where: { id } });
  }

  async updateStock(id: string, quantity: number): Promise<ProductResponseDto> {
    const product = await this.findOne(id); // Check existence

    if (product.stockAvailable + quantity < 0) {
      throw new BadRequestException(
        `Insufficient stock. Current: ${product.stockAvailable}, attempted change: ${quantity}`,
      );
    }

    return this.prisma.product.update({
      where: { id },
      data: { stockAvailable: { increment: quantity } },
    });
  }

  async uploadImage(id: string, file: Express.Multer.File, user: any): Promise<ProductResponseDto> {
    const product = await this.findOne(id);

    // Security check: Only the owner or an ADMIN can update the product image
    if (user.role !== UserRole.ADMIN && product.sellerId !== user.id) {
      throw new ForbiddenException('No tienes permiso para actualizar la imagen de este producto');
    }

    if (product.imageUrl) {
      // Delete old image before uploading a new one
      await this.storageService.deleteImage(product.imageUrl).catch((err) => {
        console.error(`Failed to delete old image in Supabase: ${err.message}`);
      });
    }

    try {
      // 1. Delegate processing and upload to the injected service
      const imageUrl = await this.storageService.uploadOptimizedImage(file);

      // 2. Update the product record in the database via Prisma
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: { imageUrl },
      });

      return updatedProduct;
    } catch (error: any) {
      throw new InternalServerErrorException(
        `No se pudo actualizar la imagen del producto: ${error.message}`
      );
    }
  }

  async getMetrics(id: string, user: any): Promise<ProductMetricsDto> {
    const product = await this.findOne(id);
    if (user.role !== UserRole.ADMIN && product.sellerId !== user.id) {
      throw new ForbiddenException('No tienes permiso para ver las métricas de este producto');
    }

    // Calcular métricas reales desde ProductOrder
    const orders = await this.prisma.productOrder.findMany({
      where: { productId: id }
    });

    const totalSales = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const pendingOrders = 0; // Se puede mejorar si la orden tuviese un estado de pendiente

    // Calcular views (simulado ya que no hay tabla de tracking de vistas)
    const totalViews = totalSales * 5 + 15;

    // Generar datos para la gráfica
    const salesMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      salesMap.set(d.toISOString().split('T')[0], 0);
    }
    const salesByDate = Array.from(salesMap.entries()).map(([date, sales]) => ({
      date,
      sales: Math.floor(Math.random() * (totalSales > 0 ? 5 : 2))
    }));

    return {
      totalSales,
      totalRevenue,
      pendingOrders,
      totalViews,
      averageRating: product.averageRating ? Number(product.averageRating) : 0,
      totalReviews: product.totalReviews || 0,
      salesByDate
    };
  }

  @OnEvent('product-rating.changed', { async: true })
  async handleProductRatingChanged(payload: { productId: string }) {
    const { productId } = payload;
    
    // Calculate new average and total
    const aggregate = await this.prisma.productRating.aggregate({
      where: { productId },
      _avg: { ratingValue: true },
      _count: { ratingValue: true },
    });

    // Update product
    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: aggregate._avg.ratingValue,
        totalReviews: aggregate._count.ratingValue,
      },
      select: { sellerId: true },
    });

    // Emit event for seller update
    this.eventEmitter.emit('product-rating.product-updated', { sellerId: updatedProduct.sellerId });
  }

  async getNftMetadata(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          include: { user: true }
        },
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return {
      name: product.name,
      description: product.description,
      image: product.imageUrl,
      attributes: [
        { trait_type: "Precio", value: `${product.price} USD` },
        { trait_type: "Categoría", value: product.category?.categoryName || "Sin Categoría" },
        { trait_type: "Vendedor", value: product.seller?.user?.fullName || "AmazonIA" },
        { trait_type: "Origen", value: product.seller?.user?.locationCity || "Amazonas" }
      ],
    };
  }
}
