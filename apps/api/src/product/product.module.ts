import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { SupabaseStorageService } from '../storage/supabase-storage.service';

@Module({
  controllers: [ProductController],
  providers: [
    ProductService,
    PrismaService,
    {
      provide: StorageService,
      useClass: SupabaseStorageService,
    },
  ],
})
export class ProductModule {}
