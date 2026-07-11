import { Test } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: { $queryRaw: jest.Mock };
  let mongoConn: { readyState: number };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn() };
    mongoConn = { readyState: 1 };

    const module = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: prisma },
        { provide: getConnectionToken(), useValue: mongoConn },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  it('returns up/up when both are healthy', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const result = await service.check();

    expect(result).toEqual({ postgres: 'up', mongodb: 'up' });
  });

  it('returns postgres:down when SELECT 1 throws', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    const result = await service.check();

    expect(result).toEqual({ postgres: 'down', mongodb: 'up' });
  });

  it('returns mongodb:down when readyState is 0 (disconnected)', async () => {
    prisma.$queryRaw.mockResolvedValue([]);
    mongoConn.readyState = 0;

    const result = await service.check();

    expect(result).toEqual({ postgres: 'up', mongodb: 'down' });
  });

  it('returns mongodb:down when readyState is 2 (connecting)', async () => {
    prisma.$queryRaw.mockResolvedValue([]);
    mongoConn.readyState = 2;

    const result = await service.check();

    expect(result).toEqual({ postgres: 'up', mongodb: 'down' });
  });

  it('returns down/down when both are unhealthy', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('postgres down'));
    mongoConn.readyState = 3;

    const result = await service.check();

    expect(result).toEqual({ postgres: 'down', mongodb: 'down' });
  });
});
