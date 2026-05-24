import { Injectable, NotFoundException } from '@nestjs/common';
import {  CreateProductCategoryDto  } from 'dtos';
import {  UpdateProductCategoryDto, PaginationDto  } from 'dtos';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductCategoryDto: CreateProductCategoryDto) {
    return this.prisma.productCategory.create({
      data: createProductCategoryDto,
    });
  }

  async findAll(query?: PaginationDto) {
    const { page = 1, limit = 10 } = query || {};
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.productCategory.count(),
      this.prisma.productCategory.findMany({ skip, take: limit }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
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
