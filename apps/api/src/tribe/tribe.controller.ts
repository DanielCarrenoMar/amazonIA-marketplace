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
import { TribeService } from './tribe.service';
import { CreateTribeDto,  UpdateTribeDto,
  UserRole,
  PaginationDto,
  TribeResponseDto,
  PaginatedResponseDto,
} from 'event-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('tribe')
export class TribeController {
  constructor(private readonly tribeService: TribeService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createTribeDto: CreateTribeDto): Promise<TribeResponseDto> {
    return this.tribeService.create(createTribeDto);
  }

  @Get()
  findAll(@Query() query: PaginationDto): Promise<PaginatedResponseDto<TribeResponseDto>> {
    return this.tribeService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<TribeResponseDto> {
    return this.tribeService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTribeDto: UpdateTribeDto,
  ): Promise<TribeResponseDto> {
    return this.tribeService.update(id, updateTribeDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<TribeResponseDto> {
    return this.tribeService.remove(id);
  }
}
