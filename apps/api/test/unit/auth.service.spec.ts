import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserAccountService } from '../../src/user-account/user-account.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from 'event-types';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('token'),
  };

  const mockUserAccountService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockPrismaService = {
    refreshToken: {
      create: jest.fn().mockResolvedValue({ tokenHash: 'hash' }),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    userAccount: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UserAccountService, useValue: mockUserAccountService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('throws UnauthorizedException if user not found', async () => {
      mockPrismaService.userAccount.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'test@test.com', password: 'pass' })).rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens if password matches', async () => {
      const user = { id: 'u1', email: 'test@test.com', passwordHash: 'hash', role: UserRole.BUYER, isActive: true };
      mockPrismaService.userAccount.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('tokenHash');

      const res = await service.login({ email: 'test@test.com', password: 'pass' });
      expect(res.accessToken).toBeDefined();
      expect(res.refreshToken).toBeDefined();
    });
  });
});
