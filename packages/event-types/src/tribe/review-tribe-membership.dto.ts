import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MembershipRequestStatus } from '../enums';

export class ReviewTribeMembershipDto {
  @IsEnum(MembershipRequestStatus)
  status: MembershipRequestStatus.APPROVED | MembershipRequestStatus.REJECTED;

  @IsString()
  @IsOptional()
  reviewNote?: string;
}
