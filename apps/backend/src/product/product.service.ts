import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CreateProductDto, UpdateProductDto, FindProductsDto, FindNearbyDto, OrderStatus, UserRole } from 'dtos';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(createProductDto: CreateProductDto, sellerId: string) {
    const { coords, ...rest } = createProductDto;

    // Use $transaction so we don't end up with orphaned rows if the spatial query fails
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the standard product record
      const product = await tx.product.create({
        data: {
          ...rest,
          sellerId,
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

  async findAll(query: FindProductsDto) {
    const { page = 1, limit = 10, search, categoryId, sellerId } = query;
    const skip = (page - 1) * limit;

    // Prisma Where conditions
    const where: import('@prisma/client').Prisma.ProductWhereInput = {
      ...(categoryId ? { categoryId } : {}),
      ...(sellerId ? { sellerId } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };

    // Run count and findMany in parallel (no transaction needed for reads)
    const [total, data] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { seller: true, category: true },
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

  async findNearby(query: FindNearbyDto) {
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
        AND ST_DWithin(
          p.location_coords,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          ${radiusMeters}
        )
      ORDER BY "distanceKm" ASC;
    `;

    return {
      data: rows,
      meta: { lat, lng, radiusKm: radius, total: rows.length },
    };
  }

  async findBySeller(sellerId: string) {
    return this.prisma.product.findMany({
      where: { sellerId },
      include: { seller: true, category: true },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { seller: true, category: true },
    });

    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: any) {
    const product = await this.findOne(id); // Check existence

    // Security check: Only the owner or an ADMIN can update the product
    if (user.role !== UserRole.ADMIN && product.sellerId !== user.id) {
      throw new ForbiddenException('No tienes permiso para actualizar este producto');
    }

    // Security check: Only an ADMIN can change the sellerId
    if (updateProductDto.sellerId && user.role !== UserRole.ADMIN) {
      delete updateProductDto.sellerId;
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: string) {
    const product = await this.findOne(id); // Check existence
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

  async updateStock(id: string, quantity: number) {
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

  async uploadImage(id: string, file: Express.Multer.File, user: any) {
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
}
