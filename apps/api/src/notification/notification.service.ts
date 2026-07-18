import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FindNotificationsDto, NotificationResponseDto } from 'event-types';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Internal function to create a notification (to be called by other services)
   */
  async createNotification(userId: string, title: string, message: string): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          title,
          message,
        }
      });
    } catch (err) {
      this.logger.error(`Failed to create notification for user ${userId}`, err);
    }
  }

  /**
   * Get notifications for a user (paginated)
   */
  async getNotificationsForUser(userId: string, dto: FindNotificationsDto): Promise<{ items: NotificationResponseDto[], total: number }> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.notification.count({ where: { userId } })
    ]);

    return { items, total };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(userId: string, notificationId: number): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: { isRead: true }
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }
}
