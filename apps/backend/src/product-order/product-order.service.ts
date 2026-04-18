import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductOrderDto } from './dto/create-product-order.dto';
import { UpdateProductOrderDto } from './dto/update-product-order.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductOrderDto: CreateProductOrderDto) {
    return this.prisma.productOrder.create({
      data: createProductOrderDto,
    });
  }

  async findAll() {
    return this.prisma.productOrder.findMany({
      include: { product: true, buyer: true, statusHistory: true },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.productOrder.findUnique({
      where: { id },
      include: { product: true, buyer: true, statusHistory: true },
    });
    
    if (!order) throw new NotFoundException(`ProductOrder with ID ${id} not found`);
    return order;
  }

  async update(id: string, updateProductOrderDto: UpdateProductOrderDto) {
    await this.findOne(id); // Check existence
    return this.prisma.productOrder.update({
      where: { id },
      data: updateProductOrderDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence
    return this.prisma.productOrder.delete({
      where: { id },
    });
  }
}
