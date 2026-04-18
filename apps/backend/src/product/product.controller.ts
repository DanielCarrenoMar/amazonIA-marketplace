import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, ParseUUIDPipe, UseGuards, Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsDto } from './dto/find-products.dto';
import { FindNearbyDto } from './dto/find-nearby.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // Requires login — only authenticated sellers can create products
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  // Public — anyone can browse products
  @Get()
  findAll(@Query() query: FindProductsDto) {
    return this.productService.findAll(query);
  }

  // Public — anyone can view a single product
  @Get('nearby')
  findNearby(@Query() query: FindNearbyDto) {
    return this.productService.findNearby(query);
  }

  // Public — anyone can view a single product
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.findOne(id);
  }

  // Requires login — only authenticated users can update products
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  // Requires login — only authenticated users can delete products
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.remove(id);
  }
}
