import { IShipmentEvent } from './shipment-event.dto';

export class ShipmentHistoryDto {
  data: IShipmentEvent[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
