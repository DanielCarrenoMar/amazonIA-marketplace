import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShippingCarrierService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.shippingCarrier.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
