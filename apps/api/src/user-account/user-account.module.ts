import { Module } from '@nestjs/common';
import { UserAccountService } from './user-account.service';
import { UserAccountController } from './user-account.controller';
import { StorageService } from '../storage/storage.service';
import { SupabaseStorageService } from '../storage/supabase-storage.service';

@Module({
  controllers: [UserAccountController],
  providers: [
    UserAccountService,
    {
      provide: StorageService,
      useClass: SupabaseStorageService,
    },
  ],
  exports: [UserAccountService], // Allow AuthModule to inject this service for register()
})
export class UserAccountModule {}
