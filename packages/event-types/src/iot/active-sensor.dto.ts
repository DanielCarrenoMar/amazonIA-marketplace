import { ShipmentSensorProfile } from '../enums';

export interface ActiveSensorCoordsDto {
  lat: number;
  lng: number;
}

export class ActiveSensorResponseDto {
  orderId: string;
  sensorId: string;
  trackingNumber: string;
  originCoords: ActiveSensorCoordsDto | null;
  destinationCoords: ActiveSensorCoordsDto | null;
  sensorProfile?: ShipmentSensorProfile;
}
