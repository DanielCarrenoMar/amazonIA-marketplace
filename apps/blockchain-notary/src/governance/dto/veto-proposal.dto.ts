import { IsString, IsNotEmpty } from 'class-validator';

export class VetoProposalDto {
  @IsString()
  @IsNotEmpty()
  elderUserId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
