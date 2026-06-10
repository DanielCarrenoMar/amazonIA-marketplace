import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductCommentDto, UpdateProductCommentDto } from 'event-types';

@Injectable()
export class ProductCommentService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateProductCommentDto) {
    // Si es una respuesta, validar la regla de 1 solo nivel
    if (createDto.parentCommentId) {
      const parent = await this.prisma.productComment.findUnique({
        where: { id: createDto.parentCommentId },
      });

      if (!parent) {
        throw new NotFoundException('El comentario al que intentas responder no existe');
      }

      if (parent.parentCommentId !== null) {
        throw new BadRequestException('Solo se permite responder a comentarios principales (1 nivel de profundidad)');
      }
    }

    return this.prisma.productComment.create({
      data: {
        productId: createDto.productId,
        userId,
        content: createDto.content,
        parentCommentId: createDto.parentCommentId || null,
      },
    });
  }

  async findAllByProduct(productId: string) {
    // Traer todos los comentarios principales (parentCommentId = null) con sus respuestas
    return this.prisma.productComment.findMany({
      where: {
        productId,
        parentCommentId: null,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            publishedAt: 'asc',
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });
  }

  async update(id: number, userId: string, updateDto: UpdateProductCommentDto) {
    const comment = await this.prisma.productComment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException('Comentario no encontrado');
    }

    if (comment.userId !== userId) {
      throw new BadRequestException('No tienes permiso para editar este comentario');
    }

    return this.prisma.productComment.update({
      where: { id },
      data: { content: updateDto.content },
    });
  }

  async remove(id: number, userId: string) {
    const comment = await this.prisma.productComment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException('Comentario no encontrado');
    }

    // Aquí podríamos validar si es ADMIN o el autor
    if (comment.userId !== userId) {
      throw new BadRequestException('No tienes permiso para eliminar este comentario');
    }

    return this.prisma.productComment.delete({
      where: { id },
    });
  }
}
