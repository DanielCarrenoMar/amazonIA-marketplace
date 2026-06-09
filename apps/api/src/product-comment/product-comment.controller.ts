import { Controller, Post, Get, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { ProductCommentService } from './product-comment.service';
import { CreateProductCommentDto, UpdateProductCommentDto } from 'event-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('product-comment')
export class ProductCommentController {
  constructor(private readonly productCommentService: ProductCommentService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() createDto: CreateProductCommentDto) {
    return this.productCommentService.create(req.user.sub, createDto);
  }

  @Get('product/:productId')
  findAllByProduct(@Param('productId') productId: string) {
    return this.productCommentService.findAllByProduct(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() updateDto: UpdateProductCommentDto
  ) {
    return this.productCommentService.update(id, req.user.sub, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.productCommentService.remove(id, req.user.sub);
  }
}
