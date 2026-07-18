import { IsString, IsNotEmpty, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';
import { ProposalType } from '@prisma/client';

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

  @IsEnum(ProposalType)
  @IsOptional()
  type?: ProposalType;
}
