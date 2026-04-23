import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, ParseUUIDPipe, UseGuards, Request,
} from '@nestjs/common';
import { ProductOrderService } from './product-order.service';
import {  CreateProductOrderDto  } from 'dtos';
import {  UpdateProductOrderDto  } from 'dtos';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('product-order')
export class ProductOrderController {
  constructor(private readonly productOrderService: ProductOrderService) {}

  // Requires login — buyerId is taken from the JWT, not from the body
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: any, @Body() createProductOrderDto: CreateProductOrderDto) {
    return this.productOrderService.create(req.user.id, createProductOrderDto);
  }

  @Get()
  findAll() {
    return this.productOrderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productOrderService.findOne(id);
  }

  @Get(':id/history')
  findHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.productOrderService.findHistory(id);
  }

  // Requires login — changedByUserId is taken from the JWT, not from the body
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body() updateProductOrderDto: UpdateProductOrderDto,
  ) {
    return this.productOrderService.update(id, req.user.id, updateProductOrderDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productOrderService.remove(id);
  }
}
