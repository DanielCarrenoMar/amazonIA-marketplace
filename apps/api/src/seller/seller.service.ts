import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {  CreateSellerDto, FindSellersDto, UserRole  } from 'event-types';
import {  UpdateSellerDto  } from 'event-types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SellerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(id: string, createSellerDto: CreateSellerDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const seller = await tx.seller.create({
          data: { id, ...createSellerDto },
        });

        await tx.userAccount.update({
          where: { id },
          data: { role: UserRole.SELLER },
        });

        return seller;
      });
    } catch (e: any) {
      // Map Prisma unique constraint error to HTTP 409
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Alguno de los campos únicos del seller ya está en uso');
      }
      throw e;
    }
  }

  async findAll(query?: FindSellersDto) {
    const { tribeId, search, page = 1, limit = 10 } = query || {};
    const skip = (page - 1) * limit;

    const where: Prisma.SellerWhereInput = {
      ...(tribeId ? { tribeId } : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: 'insensitive' } },
              { user: { fullName: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.seller.findMany({
        where,
        include: {
          user: { 
            select: { 
              id: true, 
              fullName: true, 
              username: true, 
              email: true, 
              age: true, 
              nationality: true 
            } 
          },
          tribe: true,
        },
        skip,
        take: limit,
      }),
      this.prisma.seller.count({ where }),
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

  async findOne(id: string) {
    // Instant read: the rating is already denormalized and stored in the Seller record.
    const seller = await this.prisma.seller.findUnique({
      where: { id },
      include: {
        user: { 
          select: { 
            id: true, 
            fullName: true, 
            username: true, 
            email: true, 
            age: true, 
            nationality: true 
          } 
        },
        tribe: true,
      },
    });
    
    if (!seller) throw new NotFoundException(`Vendedor con ID ${id} no encontrado`);
    return seller;
  }

  async update(id: string, updateSellerDto: UpdateSellerDto, reqUser?: { id: string; role: UserRole }) {
    await this.findOne(id); // Check existence

    if (reqUser && reqUser.role !== UserRole.ADMIN && reqUser.id !== id) {
      throw new ForbiddenException('No tienes permiso para actualizar este perfil de vendedor');
    }

    return this.prisma.seller.update({
      where: { id },
      data: updateSellerDto,
    });
  }

  async remove(id: string, reqUser?: { id: string; role: UserRole }) {
    await this.findOne(id); // Check existence

    if (reqUser && reqUser.role !== UserRole.ADMIN && reqUser.id !== id) {
      throw new ForbiddenException('No tienes permiso para eliminar este perfil de vendedor');
    }

    return this.prisma.seller.delete({
      where: { id },
    });
  }
}
