export class ProductRatingResponseDto {
  productId: string;
  userAccountId: string;
  ratingValue: number;
  createdAt: Date;
  user?: any; // AuthUserDto
  product?: any; // ProductResponseDto
}
