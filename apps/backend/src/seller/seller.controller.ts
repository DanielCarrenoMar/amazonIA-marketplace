import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { SellerService } from './seller.service';
import {  CreateSellerDto  } from 'dtos';
import {  UpdateSellerDto  } from 'dtos';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('seller')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createSellerDto: CreateSellerDto) {
    return this.sellerService.create(createSellerDto);
  }

  @Get()
  findAll() {
    return this.sellerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.sellerService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateSellerDto: UpdateSellerDto) {
    return this.sellerService.update(id, updateSellerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.sellerService.remove(id);
  }
}
