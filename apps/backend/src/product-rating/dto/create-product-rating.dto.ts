import { IsUUID, IsInt, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateProductRatingDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  // userAccountId is NOT accepted from the client — injected automatically from the JWT token

  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  ratingValue: number;
}
