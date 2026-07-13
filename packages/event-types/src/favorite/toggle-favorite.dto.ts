import { IsUUID, IsNotEmpty } from 'class-validator';

export class ToggleFavoriteDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;
}
