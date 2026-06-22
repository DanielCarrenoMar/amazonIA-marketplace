import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { GovernanceRoleEnum } from 'event-types';

export class AssignRoleDto {
  @IsString()
  @IsNotEmpty()
  targetUserId: string;

  @IsString()
  @IsNotEmpty()
  targetWalletAddress: string;

  @IsEnum(GovernanceRoleEnum)
  role: GovernanceRoleEnum;

  @IsString()
  @IsNotEmpty()
  elderUserId: string;
}

export class TransferEldershipDto {
  @IsString()
  @IsNotEmpty()
  newElderUserId: string;

  @IsString()
  @IsNotEmpty()
  newElderWalletAddress: string;
}
