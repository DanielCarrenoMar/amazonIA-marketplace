import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export const createExtendedPrismaClient = (prisma: PrismaService) => {
  return prisma.$extends({});
};

export type ExtendedPrismaClient = ReturnType<typeof createExtendedPrismaClient>;

@Injectable()
export class PrismaExtensionService implements OnModuleInit {
  public client: ExtendedPrismaClient;

  constructor(private readonly prisma: PrismaService) {
    this.client = createExtendedPrismaClient(this.prisma);
  }

  onModuleInit() {
    // Client is initialized synchronously in the constructor
  }
}
