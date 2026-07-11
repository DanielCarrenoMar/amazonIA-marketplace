import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateElaborationStepDto, UpdateElaborationStepDto, UserRole } from 'event-types';

@Injectable()
export class ProductElaborationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(productId: string, userId: string, userRole: UserRole, createDto: CreateElaborationStepDto) {
    // 1. Validate product exists and belongs to user (or user is admin)
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { sellerId: true }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (product.sellerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('No tienes permiso para modificar este producto');
    }

    // 2. Validate stepNumber uniqueness per product
    const existingStep = await this.prisma.productElaborationStep.findUnique({
      where: {
        productId_stepNumber: {
          productId,
          stepNumber: createDto.stepNumber
        }
      }
    });

    if (existingStep) {
      throw new BadRequestException(`Step number ${createDto.stepNumber} already exists for this product`);
    }

    // 3. Create step
    return this.prisma.productElaborationStep.create({
      data: {
        productId,
        stepNumber: createDto.stepNumber,
        title: createDto.title,
        description: createDto.description,
        mediaUrls: createDto.mediaUrls || []
      }
    });
  }

  async update(id: number, userId: string, userRole: UserRole, updateDto: UpdateElaborationStepDto) {
    // 1. Find step and product
    const step = await this.prisma.productElaborationStep.findUnique({
      where: { id },
      include: { product: { select: { sellerId: true } } }
    });

    if (!step) {
      throw new NotFoundException(`Elaboration step with ID ${id} not found`);
    }

    if (step.product.sellerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('No tienes permiso para modificar este producto');
    }

    // 2. If changing step number, check uniqueness
    if (updateDto.stepNumber && updateDto.stepNumber !== step.stepNumber) {
      const existingStep = await this.prisma.productElaborationStep.findUnique({
        where: {
          productId_stepNumber: {
            productId: step.productId,
            stepNumber: updateDto.stepNumber
          }
        }
      });
      if (existingStep) {
        throw new BadRequestException(`Step number ${updateDto.stepNumber} already exists for this product`);
      }
    }

    // 3. Update step
    return this.prisma.productElaborationStep.update({
      where: { id },
      data: updateDto
    });
  }

  async remove(id: number, userId: string, userRole: UserRole) {
    const step = await this.prisma.productElaborationStep.findUnique({
      where: { id },
      include: { product: { select: { sellerId: true } } }
    });

    if (!step) {
      throw new NotFoundException(`Elaboration step with ID ${id} not found`);
    }

    if (step.product.sellerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('No tienes permiso para modificar este producto');
    }

    await this.prisma.productElaborationStep.delete({
      where: { id }
    });

    return { message: 'Elaboration step deleted successfully' };
  }
}
