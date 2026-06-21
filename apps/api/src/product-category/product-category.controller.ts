import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import {
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
  UserRole,
  PaginationDto,
  ProductCategoryResponseDto,
  PaginatedResponseDto,
} from 'event-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('product-category')
export class ProductCategoryController {
  constructor(
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createProductCategoryDto: CreateProductCategoryDto): Promise<ProductCategoryResponseDto> {
    return this.productCategoryService.create(createProductCategoryDto);
  }

  @Get()
  findAll(@Query() query: PaginationDto): Promise<PaginatedResponseDto<ProductCategoryResponseDto>> {
    return this.productCategoryService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductCategoryResponseDto> {
    return this.productCategoryService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductCategoryDto: UpdateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    return this.productCategoryService.update(id, updateProductCategoryDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<ProductCategoryResponseDto> {
    return this.productCategoryService.remove(id);
  }
}
