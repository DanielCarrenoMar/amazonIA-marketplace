import { ProductResponseDto } from '../product/product-response.dto';

export interface UserFavoriteResponseDto {
  userId: string;
  productId: string;
  createdAt: Date;
  product?: ProductResponseDto;
}
