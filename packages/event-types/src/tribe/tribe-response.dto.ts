export class TribeResponseDto {
  id: number;
  name: string;
  description: string | null;
  locationMapboxId: string | null;
  locationFormattedAddress: string | null;
}
