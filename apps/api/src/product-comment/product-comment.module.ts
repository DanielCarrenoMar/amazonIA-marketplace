import { Module } from '@nestjs/common';
import { ProductCommentController } from './product-comment.controller';
import { ProductCommentService } from './product-comment.service';

@Module({
  controllers: [ProductCommentController],
  providers: [ProductCommentService],
})
export class ProductCommentModule {}
