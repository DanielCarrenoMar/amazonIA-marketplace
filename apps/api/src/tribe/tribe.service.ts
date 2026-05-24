import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {  CreateTribeDto  } from 'event-types';
import {  UpdateTribeDto, PaginationDto  } from 'event-types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TribeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTribeDto: CreateTribeDto) {
    try {
      return await this.prisma.tribe.create({
        data: createTribeDto,
      });
    } catch (e: any) {
      // Map Prisma unique constraint error to HTTP 409
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('El nombre de la tribu ya está en uso');
      }
      throw e;
    }
  }

  async findAll(query?: PaginationDto) {
    const { page = 1, limit = 10 } = query || {};
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.tribe.count(),
      this.prisma.tribe.findMany({ skip, take: limit }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const tribe = await this.prisma.tribe.findUnique({
      where: { id },
    });
    
    if (!tribe) throw new NotFoundException(`Tribe with ID ${id} not found`);
    return tribe;
  }

  async update(id: number, updateTribeDto: UpdateTribeDto) {
    await this.findOne(id); // Check existence
    return this.prisma.tribe.update({
      where: { id },
      data: updateTribeDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check existence
    return this.prisma.tribe.delete({
      where: { id },
    });
  }
}
