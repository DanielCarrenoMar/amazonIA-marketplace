import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ProductElaborationService } from './product-elaboration.service';
import { ProductElaborationController } from './product-elaboration.controller';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { SupabaseStorageService } from '../storage/supabase-storage.service';

@Module({
  controllers: [ProductController, ProductElaborationController],
  providers: [
    ProductService,
    ProductElaborationService,
    PrismaService,
    {
      provide: StorageService,
      useClass: SupabaseStorageService,
    },
  ],
  exports: [ProductService, ProductElaborationService]
})
export class ProductModule {}
