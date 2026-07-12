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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserAccountService } from './user-account.service';
import { CreateUserAccountDto, UpdateUserAccountDto, ChangePasswordDto, UserRole, PaginationDto, UserAccountResponseDto, PaginatedResponseDto } from 'event-types';
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
  ): Promise<UserAccountResponseDto> {
    return this.userAccountService.findOne(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() query: PaginationDto): Promise<PaginatedResponseDto<UserAccountResponseDto>> {
    return this.userAccountService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body() updateUserAccountDto: UpdateUserAccountDto,
  ): Promise<UserAccountResponseDto> {
    return this.userAccountService.update(id, req.user, updateUserAccountDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/password')
  changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<UserAccountResponseDto> {
    return this.userAccountService.changePassword(id, req.user, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<UserAccountResponseDto> {
    return this.userAccountService.remove(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<UserAccountResponseDto> {
    return this.userAccountService.uploadAvatar(id, file, req.user);
  }
}