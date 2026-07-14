import { IsString, IsNotEmpty, Length } from 'class-validator';

export class AddMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @Length(42, 42)
  walletAddress: string;
}
