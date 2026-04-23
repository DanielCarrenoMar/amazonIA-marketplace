import { Injectable, NotFoundException } from '@nestjs/common';
import {  CreateProductCategoryDto  } from 'dtos';
import {  UpdateProductCategoryDto  } from 'dtos';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductCategoryDto: CreateProductCategoryDto) {
    return this.prisma.productCategory.create({
      data: createProductCategoryDto,
    });
  }

  async findAll() {
    return this.prisma.productCategory.findMany();
  }

  async findOne(id: number) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!category) throw new NotFoundException(`ProductCategory with id ${id} not found`);
    return category;
  }

  async update(id: number, updateProductCategoryDto: UpdateProductCategoryDto) {
    await this.findOne(id); // Ensures it exists first
    return this.prisma.productCategory.update({
      where: { id },
      data: updateProductCategoryDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Ensures it exists first
    return this.prisma.productCategory.delete({
      where: { id },
    });
  }
}
