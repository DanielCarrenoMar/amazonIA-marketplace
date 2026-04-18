import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserAccountDto } from './dto/create-user-account.dto';
import { UpdateUserAccountDto } from './dto/update-user-account.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserAccountDto: CreateUserAccountDto) {
    return this.prisma.userAccount.create({
      data: createUserAccountDto,
    });
  }

  async findAll() {
    return this.prisma.userAccount.findMany();
  }

  async findOne(id: string) {
    const user = await this.prisma.userAccount.findUnique({
      where: { id },
    });
    
    if (!user) throw new NotFoundException(`UserAccount with ID ${id} not found`);
    return user;
  }

  async update(id: string, updateUserAccountDto: UpdateUserAccountDto) {
    await this.findOne(id); // Check existence
    return this.prisma.userAccount.update({
      where: { id },
      data: updateUserAccountDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence
    return this.prisma.userAccount.delete({
      where: { id },
    });
  }
}
