import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProductOrderService } from './product-order.service';
import { CreateProductOrderDto, UpdateProductOrderDto, UserRole } from 'dtos';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('product-order')
export class ProductOrderController {
  constructor(private readonly productOrderService: ProductOrderService) {}

  // Requires login — buyerId is taken from the JWT, not from the body
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Request() req: any,
    @Body() createProductOrderDto: CreateProductOrderDto,
  ) {
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

  // Only SELLER or ADMIN can update order status
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body() updateProductOrderDto: UpdateProductOrderDto,
  ) {
    return this.productOrderService.update(
      id,
      req.user.id,
      updateProductOrderDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productOrderService.remove(id);
  }
}
