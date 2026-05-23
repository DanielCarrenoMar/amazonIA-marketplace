import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, ParseUUIDPipe, UseGuards, Request, Query,
} from '@nestjs/common';
import { ProductRatingService } from './product-rating.service';
import { CreateProductRatingDto, PaginationDto } from 'dtos';
import { UpdateProductRatingDto } from 'dtos';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('product-rating')
export class ProductRatingController {
  constructor(private readonly productRatingService: ProductRatingService) {}

  // Requires login — userAccountId from JWT, not body
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: any, @Body() createProductRatingDto: CreateProductRatingDto) {
    return this.productRatingService.create(req.user.id, createProductRatingDto);
  }

  // Public — anyone can view all ratings
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.productRatingService.findAll(query);
  }

  // Public — anyone can view a single rating
  @Get(':productId/:userAccountId')
  findOne(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('userAccountId', ParseUUIDPipe) userAccountId: string,
  ) {
    return this.productRatingService.findOne(productId, userAccountId);
  }

  // Requires login — users can only update their own rating
  @UseGuards(JwtAuthGuard)
  @Patch(':productId')
  update(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Request() req: any,
    @Body() updateProductRatingDto: UpdateProductRatingDto,
  ) {
    return this.productRatingService.update(productId, req.user.id, updateProductRatingDto);
  }

  // Requires login — users can only delete their own rating
  @UseGuards(JwtAuthGuard)
  @Delete(':productId')
  remove(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Request() req: any,
  ) {
    return this.productRatingService.remove(productId, req.user.id);
  }
}
