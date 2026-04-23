import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateProductCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  categoryName: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  subcategoryName?: string;
}
