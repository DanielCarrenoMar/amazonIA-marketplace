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
  Query,
} from '@nestjs/common';
import { ProductOrderService } from './product-order.service';
import { CreateProductOrderDto, UpdateProductOrderDto, UserRole, FindOrdersDto } from 'dtos';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('product-order')
export class ProductOrderController {
  constructor(private readonly productOrderService: ProductOrderService) { }

  // Requires login — buyerId is taken from the JWT, not from the body
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Request() req: any,
    @Body() createProductOrderDto: CreateProductOrderDto,
  ) {
    return this.productOrderService.create(req.user.id, createProductOrderDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.productOrderService.findAll();
  }

  // NOTE: declare static routes before dynamic :id to avoid routing conflicts
  // Returns all orders for the authenticated buyer
  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  myOrders(@Request() req: any, @Query() query: FindOrdersDto) {
    return this.productOrderService.findByBuyer(req.user.id, query);
  }

  // Returns a single order owned by the authenticated buyer
  @UseGuards(JwtAuthGuard)
  @Get('my-orders/:id')
  myOrderDetail(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.productOrderService.findOneForBuyer(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @Get('seller-orders')
  findBySeller(@Request() req: any, @Query() query: FindOrdersDto) {
    return this.productOrderService.findBySeller(req.user.id, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productOrderService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/history')
  findHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.productOrderService.findHistory(id);
  }

  // Login required. Service enforces buyer/admin/seller ownership rules.
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body() updateProductOrderDto: UpdateProductOrderDto,
  ) {
    return this.productOrderService.update(
      id,
      req.user,
      updateProductOrderDto,
    );
  }

  // Login required. Service enforces buyer/admin ownership rules.
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.productOrderService.remove(id, req.user);
  }
}
