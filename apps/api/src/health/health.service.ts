import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthStatus {
  postgres: 'up' | 'down';
  mongodb: 'up' | 'down';
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  async check(): Promise<HealthStatus> {
    const [postgres, mongodb] = await Promise.all([
      this.checkPostgres(),
      this.checkMongo(),
    ]);
    return { postgres, mongodb };
  }

  private async checkPostgres(): Promise<'up' | 'down'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }

  private checkMongo(): 'up' | 'down' {
    // readyState 1 = connected
    return this.mongoConnection.readyState === 1 ? 'up' : 'down';
  }
}
