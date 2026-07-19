import { Controller, Get, UseGuards, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActiveSensorResponseDto } from 'event-types';

class SimulatorAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader) throw new UnauthorizedException('Missing token');
    
    const token = authHeader.split(' ')[1];
    
    if (!process.env.SIMULATOR_API_TOKEN) {
      throw new UnauthorizedException('Simulator token not configured on server');
    }

    if (token !== process.env.SIMULATOR_API_TOKEN) {
      throw new UnauthorizedException('Invalid simulator token');
    }
    return true;
  }
}

@Controller('shipments/active-sensors')
export class ActiveSensorsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @UseGuards(SimulatorAuthGuard)
  async getActiveSensors(): Promise<ActiveSensorResponseDto[]> {
    try {
      // NOTE: Uses ST_Y/ST_X from PostGIS to extract lat/lng from geography columns.
      // If PostGIS is not enabled on Neon, run: CREATE EXTENSION IF NOT EXISTS postgis;
      const rawOrders = await this.prisma.$queryRaw<Array<{
        orderId: string;
        sensorId: string;
        trackingNumber: string;
        originLat: number | null;
        originLng: number | null;
        destLat: number | null;
        destLng: number | null;
        sensorProfile: string | null;
      }>>`
        SELECT 
          o.id as "orderId",
          o.sensor_id as "sensorId",
          o.sensor_profile as "sensorProfile",
          o.tracking_number as "trackingNumber",
          ST_Y(p.location_coords::geometry) as "originLat",
          ST_X(p.location_coords::geometry) as "originLng",
          ST_Y(u.location_coords::geometry) as "destLat",
          ST_X(u.location_coords::geometry) as "destLng"
        FROM product_order o
        JOIN product p ON o.product_id = p.id
        JOIN user_account u ON o.buyer_id = u.id
        WHERE o.current_status = 'SHIPPED'::"OrderStatus"
          AND o.sensor_id IS NOT NULL;
      `;

      return rawOrders.map(row => ({
        orderId: row.orderId,
        sensorId: row.sensorId,
        sensorProfile: row.sensorProfile as any,
        trackingNumber: row.trackingNumber,
        originCoords: row.originLat !== null && row.originLng !== null 
          ? { lat: row.originLat, lng: row.originLng } 
          : null,
        destinationCoords: row.destLat !== null && row.destLng !== null 
          ? { lat: row.destLat, lng: row.destLng } 
          : null,
      }));
    } catch (err: any) {
      // Re-throw with a readable message so the error filter logs the real cause
      const detail = err?.message ?? String(err);
      throw new Error(`active-sensors query failed: ${detail}`);
    }
  }
}
