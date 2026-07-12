import { Injectable, NotFoundException } from '@nestjs/common';
import {  CreateProductCategoryDto, ProductCategoryResponseDto, PaginatedResponseDto, GroupedCategoryResponseDto  } from 'event-types';
import {  UpdateProductCategoryDto, PaginationDto  } from 'event-types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductCategoryDto: CreateProductCategoryDto): Promise<ProductCategoryResponseDto> {
    return this.prisma.productCategory.create({
      data: createProductCategoryDto,
    });
  }

  async findAll(): Promise<GroupedCategoryResponseDto[]> {
    const categories = await this.prisma.productCategory.findMany();

    const groupedMap = new Map<string, { id: number; subcategoryName: string | null }[]>();
    for (const cat of categories) {
      if (!groupedMap.has(cat.categoryName)) {
        groupedMap.set(cat.categoryName, []);
      }
      groupedMap.get(cat.categoryName)!.push({
        id: cat.id,
        subcategoryName: cat.subcategoryName,
      });
    }

    return Array.from(groupedMap.entries()).map(([categoryName, subcategories]) => ({
      categoryName,
      subcategories,
    }));
  }

  async findOne(id: number): Promise<ProductCategoryResponseDto> {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!category) throw new NotFoundException(`ProductCategory with id ${id} not found`);
    return category;
  }

  async update(id: number, updateProductCategoryDto: UpdateProductCategoryDto): Promise<ProductCategoryResponseDto> {
    await this.findOne(id); // Ensures it exists first
    return this.prisma.productCategory.update({
      where: { id },
      data: updateProductCategoryDto,
    });
  }

  async remove(id: number): Promise<ProductCategoryResponseDto> {
    await this.findOne(id); // Ensures it exists first
    return this.prisma.productCategory.delete({
      where: { id },
    });
  }
}
