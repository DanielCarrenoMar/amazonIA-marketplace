import { Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelemetryIntegrationService } from '../telemetry-integration/telemetry-integration.service';
import { PaginationDto, ShipmentHistoryDto } from 'event-types';

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly telemetryIntegration: TelemetryIntegrationService,
    private readonly prismaService: PrismaService,
  ) {}

  async getHistory(
    trackingNumber: string,
    query: PaginationDto,
    user: { id: string; role: string },
  ): Promise<ShipmentHistoryDto> {
    if (user.role !== 'ADMIN') {
      const order = await this.prismaService.productOrder.findFirst({
        where: { trackingNumber },
        include: { product: true },
      });

      if (!order) {
        throw new UnauthorizedException('You do not have access to this shipment');
      }

      const isBuyer = order.buyerId === user.id;
      const isSeller = order.product.sellerId === user.id;

      if (!isBuyer && !isSeller) {
        throw new UnauthorizedException('You do not have access to this shipment');
      }
    }

    const { limit = 10, page = 1 } = query;

    const result = await this.telemetryIntegration.getShipmentHistory(
      trackingNumber,
      page,
      limit,
    );

    if (result === null) {
      throw new ServiceUnavailableException(
        'Telemetry service temporarily unavailable. Please retry shortly.',
      );
    }

    if (result.total === 0) {
      throw new NotFoundException(
        `No events found for tracking number ${trackingNumber}`,
      );
    }

    const offset = (page - 1) * limit;

    return {
      data: result.data,
      meta: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total,
      },
    };
  }
}
