import { Module } from '@nestjs/common';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';
import { DbService } from './db.service';

@Module({
  controllers: [IngestController],
  providers: [IngestService, DbService],
})
export class IngestModule {}
