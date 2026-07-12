import { Injectable } from '@nestjs/common';
import { ShippingCarrierResponseDto } from 'event-types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShippingCarrierService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<ShippingCarrierResponseDto[]> {
    return this.prisma.shippingCarrier.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
