import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class CastVoteDto {
  @IsString()
  @IsNotEmpty()
  voterUserId: string;

  @IsBoolean()
  inFavor: boolean;
}
