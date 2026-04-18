import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTribeDto } from './dto/create-tribe.dto';
import { UpdateTribeDto } from './dto/update-tribe.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TribeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTribeDto: CreateTribeDto) {
    return this.prisma.tribe.create({
      data: createTribeDto,
    });
  }

  async findAll() {
    return this.prisma.tribe.findMany();
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
