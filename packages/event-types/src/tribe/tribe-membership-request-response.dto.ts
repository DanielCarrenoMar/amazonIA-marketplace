import { MembershipRequestStatus } from '../enums';

export class TribeMembershipRequestResponseDto {
  id: number;
  tribeId: number;
  sellerId: string;
  status: MembershipRequestStatus;
  message: string | null;
  reviewNote: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}
