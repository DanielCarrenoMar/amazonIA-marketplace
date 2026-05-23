import { IsString, IsNotEmpty, IsOptional, IsInt, IsNumber, Min, Max, IsUUID } from 'class-validator';

export class CreateSellerDto {
  // Must be an existing UserAccount UUID
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsInt()
  @IsOptional()
  tribeId?: number;





  @IsString()
  @IsOptional()
  description?: string;
}
