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
import { MongoModule } from 'database';
import { ShipmentsModule } from './shipments/shipments.module';
import { ShippingCarrierModule } from './shipping-carrier/shipping-carrier.module';
import { MessagingModule } from 'messaging';

import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10, // Global limit: 10 requests per minute per IP
      },
    ]),
    ScheduleModule.forRoot(),
    MongoModule,
    MessagingModule.forRoot(),
    PrismaModule,
    AuthModule,
    UserAccountModule,
    TribeModule,
    SellerModule,
    ProductCategoryModule,
    ProductModule,
    ProductOrderModule,
    ProductRatingModule,
    ShipmentsModule,
    ShippingCarrierModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
