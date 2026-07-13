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
import { ProductCommentModule } from './product-comment/product-comment.module';
import { FavoriteModule } from './favorite/favorite.module';
import { OrderChatModule } from './order-chat/order-chat.module';
import { MessagingModule } from 'messaging';
import { BlockchainModule } from './blockchain/blockchain.module';
import { HealthModule } from './health/health.module';
import { InferenceModule } from './inference/inference.module';
import { SpatialModule } from './spatial/spatial.module';

import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // Global limit: 100 requests per minute per IP
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
    ProductCommentModule,
    FavoriteModule,
    OrderChatModule,
    BlockchainModule,
    HealthModule,
    InferenceModule,
    SpatialModule,
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
