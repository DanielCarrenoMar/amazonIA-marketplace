import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  @IsNotEmpty()
  proposalId: string;

  @IsString()
  @IsNotEmpty()
  contentHash: string;

  @IsString()
  @IsNotEmpty()
  proposerUserId: string;

  @IsNumber()
  @Min(1)
  deadlineMinutes: number;
}
