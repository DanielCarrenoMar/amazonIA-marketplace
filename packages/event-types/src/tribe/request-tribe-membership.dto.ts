import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestTribeMembershipDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string;
}
