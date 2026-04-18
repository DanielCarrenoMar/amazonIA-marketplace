import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserAccountModule } from './user-account/user-account.module';
import { TribeModule } from './tribe/tribe.module';
import { SellerModule } from './seller/seller.module';
import { ProductCategoryModule } from './product-category/product-category.module';
import { ProductModule } from './product/product.module';
import { ProductOrderModule } from './product-order/product-order.module';
import { ProductRatingModule } from './product-rating/product-rating.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule, UserAccountModule, TribeModule, SellerModule, ProductCategoryModule, ProductModule, ProductOrderModule, ProductRatingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
