import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {  CreateSellerDto  } from 'dtos';
import {  UpdateSellerDto  } from 'dtos';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SellerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSellerDto: CreateSellerDto) {
    try {
      return await this.prisma.seller.create({
        data: createSellerDto,
      });
    } catch (e: any) {
      // Map Prisma unique constraint error to HTTP 409
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Alguno de los campos únicos del seller ya está en uso');
      }
      throw e;
    }
  }

  async findAll() {
    // Lectura directa: ya no es necesario $queryRaw o agregar en tiempo de ejecución.
    // Los campos avgProductRating y totalReviews ahora vienen nativamente.
    return this.prisma.seller.findMany({
      include: { user: true, tribe: true },
    });
  }

  async findOne(id: string) {
    // Lectura instantánea: la calificación ya está desnormalizada y guardada en el Seller.
    const seller = await this.prisma.seller.findUnique({
      where: { id },
      include: { user: true, tribe: true },
    });
    
    if (!seller) throw new NotFoundException(`Seller with ID ${id} not found`);
    return seller;
  }

  async update(id: string, updateSellerDto: UpdateSellerDto) {
    await this.findOne(id); // Check existence
    return this.prisma.seller.update({
      where: { id },
      data: updateSellerDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence
    return this.prisma.seller.delete({
      where: { id },
    });
  }
}
