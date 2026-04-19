import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SellerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSellerDto: CreateSellerDto) {
    return this.prisma.seller.create({
      data: createSellerDto,
    });
  }

  async findAll() {
    return this.prisma.seller.findMany({
      include: { user: true, tribe: true }, // Helpful to pull user details
    });
  }

  async findOne(id: string) {
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
