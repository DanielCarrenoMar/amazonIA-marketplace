import { IsString, IsNotEmpty, IsOptional, IsInt, IsNumber, Min, Max, IsUUID } from 'class-validator';

export class CreateSellerDto {


  @IsInt()
  @IsOptional()
  tribeId?: number;





  @IsString()
  @IsOptional()
  description?: string;
}
