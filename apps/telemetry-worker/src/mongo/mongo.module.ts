import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import {
  ClimateEventDocument,
  ClimateEventSchema,
} from './schemas/climate-event.schema';
import {
  ShipmentEventDocument,
  ShipmentEventSchema,
} from './schemas/shipment-event.schema';

@Module({
  imports: [
    // Connect to MongoDB Atlas using the URI from environment
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // Register Mongoose schemas for both time-series collections
    MongooseModule.forFeature([
      { name: ClimateEventDocument.name, schema: ClimateEventSchema },
      { name: ShipmentEventDocument.name, schema: ShipmentEventSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongoModule {}
