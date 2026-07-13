import { Controller, Get, Patch, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { FindNotificationsDto, NotificationResponseDto } from 'event-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @GetUser('id') userId: string,
    @Query() query: FindNotificationsDto
  ): Promise<{ items: NotificationResponseDto[], total: number }> {
    return this.notificationService.getNotificationsForUser(userId, query);
  }

  @Patch('read-all')
  async markAllAsRead(@GetUser('id') userId: string): Promise<{ success: boolean }> {
    await this.notificationService.markAllAsRead(userId);
    return { success: true };
  }

  @Patch(':id/read')
  async markAsRead(
    @GetUser('id') userId: string,
    @Param('id', ParseIntPipe) notificationId: number
  ): Promise<{ success: boolean }> {
    await this.notificationService.markAsRead(userId, notificationId);
    return { success: true };
  }
}
