import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, ParseUUIDPipe, UseGuards, Query,
  UseInterceptors, UploadedFile, UploadedFiles, BadRequestException, Req
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto, FindProductsDto, FindNearbyDto, UserRole, PaginationDto, ProductResponseDto, NearbyProductResponseDto, PaginatedResponseDto, ProductMetricsDto } from 'event-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  // Only authenticated sellers or admins can create products
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @Post()
  create(@Body() createProductDto: CreateProductDto, @Req() req: any): Promise<ProductResponseDto> {
    return this.productService.create(createProductDto, req.user.id);
  }

  // Public — anyone can browse products
  @Get()
  findAll(@Query() query: FindProductsDto): Promise<PaginatedResponseDto<ProductResponseDto>> {
    return this.productService.findAll(query);
  }

  // Public — anyone can view a single product
  @Get('nearby')
  findNearby(@Query() query: FindNearbyDto): Promise<PaginatedResponseDto<NearbyProductResponseDto>> {
    return this.productService.findNearby(query);
  }

  // Only the authenticated seller can see their own products.
  // Admins should use GET /product?sellerId=<uuid> to inspect any seller's products.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Get('my-products')
  findBySeller(@Req() req: any, @Query() query: PaginationDto): Promise<PaginatedResponseDto<ProductResponseDto>> {
    return this.productService.findBySeller(req.user.id, query);
  }

  // Public — anyone can view a single product
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductResponseDto> {
    return this.productService.findOne(id);
  }

  // Only the authenticated seller or admin can see metrics
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @Get(':id/metrics')
  getMetrics(@Param('id', ParseUUIDPipe) id: string, @Req() req: any): Promise<ProductMetricsDto> {
    return this.productService.getMetrics(id, req.user);
  }

  // Only authenticated sellers or admins can update — service enforces ownership
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: any,
  ): Promise<ProductResponseDto> {
    return this.productService.update(id, updateProductDto, req.user);
  }

  // Sellers can delete their own products; admins can delete any — service enforces ownership
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any): Promise<ProductResponseDto> {
    return this.productService.remove(id, req.user);
  }

  // Only sellers and admins can upload product images
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @Post(':id/image')
  @UseInterceptors(FilesInterceptor('files', 4, {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new BadRequestException('Solo se permiten archivos de imagen'), false);
      }
      cb(null, true);
    },
  }))
  async uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ): Promise<ProductResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se han proporcionado archivos de imagen');
    }

    return this.productService.uploadImage(id, files, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @Delete(':id/elaboration-image')
  async removeElaborationImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Query('url') url: string,
  ): Promise<ProductResponseDto> {
    if (!url) throw new BadRequestException('Image URL is required');
    return this.productService.removeSpecificElaborationImage(id, url, req.user);
  }

  // Only sellers and admins can upload elaboration images
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @Post(':id/elaboration-images')
  @UseInterceptors(FilesInterceptor('files', 20, {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new BadRequestException('Solo se permiten archivos de imagen'), false);
      }
      cb(null, true);
    },
  }))
  async uploadElaborationImages(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ): Promise<ProductResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se han proporcionado archivos');
    }
    return this.productService.uploadElaborationImages(id, files, req.user);
  }

  // Only sellers and admins can delete product images
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @Delete(':id/image')
  async removeImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Query('url') url?: string,
  ): Promise<ProductResponseDto> {
    if (url) {
      return this.productService.removeSpecificImage(id, url, req.user);
    }
    return this.productService.removeImage(id, req.user);
  }

  // Public — anyone can view metadata of a product NFT (e.g. OpenSea)
  @Get(':id/nft-metadata')
  getNftMetadata(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.getNftMetadata(id);
  }
}
