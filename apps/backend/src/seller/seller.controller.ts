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
import { CreateSellerDto, UpdateSellerDto, UserRole, FindSellersDto } from 'dtos';
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
  @Roles(UserRole.ADMIN)
  @Post(':userId')
  create(@Param('userId', ParseUUIDPipe) userId: string, @Body() createSellerDto: CreateSellerDto) {
    return this.sellerService.create(userId, createSellerDto);
  }

  @Get()
  findAll(@Query() query: FindSellersDto) {
    return this.sellerService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.sellerService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSellerDto: UpdateSellerDto,
    @Request() req: any,
  ) {
    return this.sellerService.update(id, updateSellerDto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.sellerService.remove(id, req.user);
  }
}
