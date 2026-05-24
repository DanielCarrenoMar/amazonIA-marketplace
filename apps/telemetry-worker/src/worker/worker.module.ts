import { Module } from '@nestjs/common';
import { MongoModule } from '../mongo/mongo.module';
import { WorkerService } from './worker.service';

@Module({
  imports: [MongoModule],
  providers: [WorkerService],
})
export class WorkerModule {}
