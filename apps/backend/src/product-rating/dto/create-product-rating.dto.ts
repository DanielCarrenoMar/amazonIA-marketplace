import { IsNotEmpty, IsUUID, IsInt, Min, Max } from 'class-validator';

export class CreateProductRatingDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsUUID()
  @IsNotEmpty()
  userAccountId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  ratingValue: number;
}
