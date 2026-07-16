import { Global, Module } from '@nestjs/common';
import { SpatialService } from './spatial.service';

@Global()
@Module({
  providers: [SpatialService],
  exports: [SpatialService],
})
export class SpatialModule {}
