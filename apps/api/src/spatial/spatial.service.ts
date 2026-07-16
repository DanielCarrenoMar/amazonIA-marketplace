import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SpatialService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Updates the locationCoords (PostGIS geography) for a UserAccount.
   * Note: PostGIS ST_MakePoint takes (longitude, latitude).
   */
  async updateUserLocation(userId: string, lat: number, lng: number): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        UPDATE user_account 
        SET location_coords = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        WHERE id = ${userId}::uuid
      `;
    } catch (error) {
      console.error('Error updating user location in PostGIS:', error);
      throw new InternalServerErrorException('Error al actualizar las coordenadas espaciales.');
    }
  }
}
