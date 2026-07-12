import {
  Controller, Post, Body, Patch, Param,
  Delete, ParseUUIDPipe, ParseIntPipe, UseGuards, Req
} from '@nestjs/common';
import { ProductElaborationService } from './product-elaboration.service';
import { CreateElaborationStepDto, UpdateElaborationStepDto, UserRole } from 'event-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('product')
export class ProductElaborationController {
  constructor(private readonly elaborationService: ProductElaborationService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @Post(':productId/elaboration-step')
  create(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() createDto: CreateElaborationStepDto,
    @Req() req: any
  ) {
    return this.elaborationService.create(productId, req.user.id, req.user.role, createDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @Patch('elaboration-step/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateElaborationStepDto,
    @Req() req: any
  ) {
    return this.elaborationService.update(id, req.user.id, req.user.role, updateDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @Delete('elaboration-step/:id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ) {
    return this.elaborationService.remove(id, req.user.id, req.user.role);
  }
}
