import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ProductRatingService } from './product-rating.service';
import { CreateProductRatingDto } from './dto/create-product-rating.dto';
import { UpdateProductRatingDto } from './dto/update-product-rating.dto';

@Controller('product-rating')
export class ProductRatingController {
  constructor(private readonly productRatingService: ProductRatingService) {}

  @Post()
  create(@Body() createProductRatingDto: CreateProductRatingDto) {
    return this.productRatingService.create(createProductRatingDto);
  }

  @Get()
  findAll() {
    return this.productRatingService.findAll();
  }

  @Get(':productId/:userAccountId')
  findOne(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('userAccountId', ParseUUIDPipe) userAccountId: string
  ) {
    return this.productRatingService.findOne(productId, userAccountId);
  }

  @Patch(':productId/:userAccountId')
  update(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('userAccountId', ParseUUIDPipe) userAccountId: string,
    @Body() updateProductRatingDto: UpdateProductRatingDto
  ) {
    return this.productRatingService.update(productId, userAccountId, updateProductRatingDto);
  }

  @Delete(':productId/:userAccountId')
  remove(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('userAccountId', ParseUUIDPipe) userAccountId: string
  ) {
    return this.productRatingService.remove(productId, userAccountId);
  }
}
