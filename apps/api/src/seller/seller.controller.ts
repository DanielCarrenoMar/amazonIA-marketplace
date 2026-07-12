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
  Query,
  Request,
} from '@nestjs/common';
import { SellerService } from './seller.service';
import {
  CreateSellerDto,
  UpdateSellerDto,
  FindSellersDto,
  UserRole,
  SellerResponseDto,
  PaginatedResponseDto,
  SellerMetricsResponseDto,
} from 'event-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('seller')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @UseGuards(JwtAuthGuard)
  @Post('register-me')
  registerMe(@Body() createSellerDto: CreateSellerDto, @Request() req: any) {
    return this.sellerService.create(req.user.id, createSellerDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Get('me/metrics')
  getMyMetrics(@Request() req: any): Promise<SellerMetricsResponseDto> {
    return this.sellerService.getMetrics(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':userId')
  create(@Request() req: any, @Body() createSellerDto: CreateSellerDto): Promise<SellerResponseDto> {
    return this.sellerService.create(req.params.userId, createSellerDto);
  }

  @Get()
  findAll(@Query() query: FindSellersDto): Promise<PaginatedResponseDto<SellerResponseDto>> {
    return this.sellerService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SellerResponseDto> {
    return this.sellerService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSellerDto: UpdateSellerDto,
    @Request() req: any,
  ): Promise<SellerResponseDto> {
    return this.sellerService.update(id, req.user, updateSellerDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.sellerService.remove(id, req.user);
  }
}
