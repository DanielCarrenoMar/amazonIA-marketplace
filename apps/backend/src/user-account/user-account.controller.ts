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
import { UserAccountService } from './user-account.service';
import { CreateUserAccountDto, UpdateUserAccountDto, ChangePasswordDto, UserRole, PaginationDto } from 'dtos';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('user-account')
export class UserAccountController {
  constructor(private readonly userAccountService: UserAccountService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.userAccountService.findOne(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.userAccountService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body() updateUserAccountDto: UpdateUserAccountDto,
  ) {
    return this.userAccountService.update(id, req.user, updateUserAccountDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/password')
  changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.userAccountService.changePassword(id, req.user, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.userAccountService.remove(id, req.user);
  }
}