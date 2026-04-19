import { Module } from '@nestjs/common';
import { UserAccountService } from './user-account.service';
import { UserAccountController } from './user-account.controller';

@Module({
  controllers: [UserAccountController],
  providers: [UserAccountService],
  exports: [UserAccountService], // Allow AuthModule to inject this service for register()
})
export class UserAccountModule {}
