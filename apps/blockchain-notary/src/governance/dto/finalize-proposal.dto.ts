import { IsString, IsNotEmpty } from 'class-validator';

export class FinalizeProposalDto {
  @IsString()
  @IsNotEmpty()
  elderUserId: string;
}
