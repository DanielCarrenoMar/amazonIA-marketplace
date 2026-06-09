import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClimateEventDocument, ClimateEventSchema } from './schemas/climate-event.schema';
import { ShipmentEventDocument, ShipmentEventSchema } from './schemas/shipment-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClimateEventDocument.name, schema: ClimateEventSchema },
      { name: ShipmentEventDocument.name, schema: ShipmentEventSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongoTelemetryModule {}
