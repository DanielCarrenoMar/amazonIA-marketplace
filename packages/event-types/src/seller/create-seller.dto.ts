import { IsString, IsNotEmpty, IsOptional, IsInt, IsNumber, Min, Max, IsUUID } from 'class-validator';

export class CreateSellerDto {

  @IsString()
  @IsOptional()
  description?: string;
}
