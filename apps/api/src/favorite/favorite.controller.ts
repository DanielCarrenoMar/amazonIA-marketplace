import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { ToggleFavoriteDto } from 'event-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post('toggle')
  toggleFavorite(@Req() req: any, @Body() toggleFavoriteDto: ToggleFavoriteDto) {
    return this.favoriteService.toggleFavorite(req.user.id, toggleFavoriteDto);
  }

  @Get()
  getFavorites(@Req() req: any) {
    return this.favoriteService.getFavorites(req.user.id);
  }

  @Get('ids')
  getFavoriteIds(@Req() req: any) {
    return this.favoriteService.getFavoriteIds(req.user.id);
  }
}
