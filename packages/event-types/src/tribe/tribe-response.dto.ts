import { TribeStatus } from '../enums';

export class TribeResponseDto {
  id: number;
  name: string;
  description: string | null;
  status: TribeStatus;
  primaryLeaderId: string | null;
  secondaryLeaderId: string | null;
  requestedById: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  locationMapboxId: string | null;
  locationFormattedAddress: string | null;
  createdAt: Date;
}
