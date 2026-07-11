import { IsString, IsNotEmpty, IsOptional, MaxLength, IsInt, Min, IsArray, ArrayMaxSize } from 'class-validator';

export class CreateElaborationStepDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  stepNumber: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(10)
  mediaUrls?: string[];
}
