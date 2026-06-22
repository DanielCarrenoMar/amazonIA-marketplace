import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TribeStatus } from '../enums';

export class ReviewTribeCreationDto {
  @IsEnum(TribeStatus)
  status: TribeStatus.ACTIVE | TribeStatus.REJECTED;

  @IsString()
  @IsOptional()
  reviewNote?: string;
}
