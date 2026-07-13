import { Controller, Get, Patch, Param, Query, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { FindNotificationsDto, NotificationResponseDto } from 'event-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @Req() req: any,
    @Query() query: FindNotificationsDto
  ): Promise<{ items: NotificationResponseDto[], total: number }> {
    return this.notificationService.getNotificationsForUser(req.user.id, query);
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: any): Promise<{ success: boolean }> {
    await this.notificationService.markAllAsRead(req.user.id);
    return { success: true };
  }

  @Patch(':id/read')
  async markAsRead(
    @Req() req: any,
    @Param('id', ParseIntPipe) notificationId: number
  ): Promise<{ success: boolean }> {
    await this.notificationService.markAsRead(req.user.id, notificationId);
    return { success: true };
  }
}
