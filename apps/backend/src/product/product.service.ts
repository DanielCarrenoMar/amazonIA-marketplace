import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createProductDto: import('./dto/create-product.dto').CreateProductDto) {
    const { coords, ...rest } = createProductDto;

    // Use $transaction so we don't end up with orphaned rows if the spatial query fails
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the standard product record
      const product = await tx.product.create({
        data: rest,
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

  async findAll(query: import('./dto/find-products.dto').FindProductsDto) {
    const { page = 1, limit = 10, search, categoryId } = query;
    const skip = (page - 1) * limit;

    // Prisma Where conditions
    const where: import('@prisma/client').Prisma.ProductWhereInput = {
      ...(categoryId ? { categoryId } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };

    // Run count and findMany in parallel via transaction
    const [total, data] = await this.prisma.$transaction([
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

  async findNearby(query: import('./dto/find-nearby.dto').FindNearbyDto) {
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

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { seller: true, category: true },
    });

    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id); // Check existence
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence
    return this.prisma.product.delete({
      where: { id },
    });
  }

  async findBySeller(sellerId: string) {
    return this.prisma.product.findMany({
      where: { sellerId },
      include: { seller: true, category: true },
    });
  }

  async updateStock(id: string, quantity: number) {
    const product = await this.findOne(id); // Check existence
    const newStock = product.stockAvailable + quantity;

    if (newStock < 0) {
      throw new BadRequestException(
        `Insufficient stock. Current: ${product.stockAvailable}, attempted change: ${quantity}`,
      );
    }

    return this.prisma.product.update({
      where: { id },
      data: { stockAvailable: newStock },
    });
  }
}
