import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserAccountDto, UpdateUserAccountDto, UserRole } from 'dtos';
import { PrismaService } from '../prisma/prisma.service';

const SALT_ROUNDS = 12;

@Injectable()
export class UserAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserAccountDto: CreateUserAccountDto) {
    const { password, ...rest } = createUserAccountDto;

    // Hash the plain password before persisting — never store plain text
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    return this.prisma.userAccount.create({
      data: { ...rest, passwordHash },
    });
  }

  async findAll() {
    return this.prisma.userAccount.findMany({
      // Exclude the passwordHash field from the response
      omit: { passwordHash: true },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.userAccount.findUnique({
      where: { id },
      omit: { passwordHash: true },
    });

    if (!user) throw new NotFoundException(`UserAccount with ID ${id} not found`);
    return user;
  }

  async update(
    id: string,
    reqUser: { id: string; role: UserRole },
    updateUserAccountDto: UpdateUserAccountDto,
  ) {
    await this.findOne(id); // Check existence

    // Only the account owner or an ADMIN can update this account
    if (reqUser.id !== id && reqUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own account');
    }

    // If a new password is provided, hash it before updating
    const { password, ...rest } = updateUserAccountDto as any;
    const data = password
      ? { ...rest, passwordHash: await bcrypt.hash(password, SALT_ROUNDS) }
      : rest;

    return this.prisma.userAccount.update({
      where: { id },
      data,
      omit: { passwordHash: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence
    return this.prisma.userAccount.delete({
      where: { id },
    });
  }
}
