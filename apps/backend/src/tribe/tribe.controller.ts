import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { TribeService } from './tribe.service';
import {  CreateTribeDto  } from 'dtos';
import {  UpdateTribeDto  } from 'dtos';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tribe')
export class TribeController {
  constructor(private readonly tribeService: TribeService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createTribeDto: CreateTribeDto) {
    return this.tribeService.create(createTribeDto);
  }

  @Get()
  findAll() {
    return this.tribeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tribeService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTribeDto: UpdateTribeDto) {
    return this.tribeService.update(id, updateTribeDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tribeService.remove(id);
  }
}
