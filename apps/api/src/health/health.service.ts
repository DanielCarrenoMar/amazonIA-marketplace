import { Injectable, Optional } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthStatus {
  postgres: 'up' | 'down';
  mongodb: 'up' | 'down' | 'disabled';
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @InjectConnection() private readonly mongoConnection: Connection | undefined,
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

  private checkMongo(): 'up' | 'down' | 'disabled' {
    if (!this.mongoConnection) return 'disabled';
    // readyState 1 = connected
    return this.mongoConnection.readyState === 1 ? 'up' : 'down';
  }
}
