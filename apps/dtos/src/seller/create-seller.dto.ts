import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsUUID } from 'class-validator';

export class CreateSellerDto {
  // Must be an existing UserAccount UUID
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsInt()
  @IsOptional()
  tribeId?: number;

  // Rating is checked to be exactly between 1 and 5
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  description?: string;
}
