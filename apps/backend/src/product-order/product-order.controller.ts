import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductOrderService } from './product-order.service';
import { CreateProductOrderDto } from './dto/create-product-order.dto';
import { UpdateProductOrderDto } from './dto/update-product-order.dto';

@Controller('product-order')
export class ProductOrderController {
  constructor(private readonly productOrderService: ProductOrderService) {}

  @Post()
  create(@Body() createProductOrderDto: CreateProductOrderDto) {
    return this.productOrderService.create(createProductOrderDto);
  }

  @Get()
  findAll() {
    return this.productOrderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productOrderService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductOrderDto: UpdateProductOrderDto) {
    return this.productOrderService.update(+id, updateProductOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productOrderService.remove(+id);
  }
}
