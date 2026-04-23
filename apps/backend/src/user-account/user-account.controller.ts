import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { UserAccountService } from './user-account.service';
import {  CreateUserAccountDto  } from 'dtos';
import {  UpdateUserAccountDto  } from 'dtos';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('user-account')
export class UserAccountController {
  constructor(private readonly userAccountService: UserAccountService) {}

  // Public — Used for user registration
  @Post()
  create(@Body() createUserAccountDto: CreateUserAccountDto) {
    return this.userAccountService.create(createUserAccountDto);
  }

  @Get()
  findAll() {
    return this.userAccountService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userAccountService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserAccountDto: UpdateUserAccountDto) {
    return this.userAccountService.update(id, updateUserAccountDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userAccountService.remove(id);
  }
}
