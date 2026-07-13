import { Module } from '@nestjs/common';
import { InferenceService } from './inference.service';
import { InferenceController } from './inference.controller';

@Module({
  controllers: [InferenceController],
  providers: [InferenceService],
  exports: [InferenceService],
})
export class InferenceModule {}
