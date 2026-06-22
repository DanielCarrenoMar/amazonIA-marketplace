import { IsString, IsNotEmpty, IsNumber, IsPositive, IsUrl, IsOptional } from 'class-validator';

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

  /**
   * Duración de la votación en minutos (desde ahora).
   * Se convertirá en un timestamp Unix para el smart contract.
   */
  @IsNumber()
  @IsPositive()
  deadlineMinutes: number;

  @IsString()
  @IsOptional()
  @IsUrl()
  webhookUrl?: string;
}
