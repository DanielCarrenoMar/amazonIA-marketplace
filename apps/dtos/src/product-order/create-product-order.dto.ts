import { IsString, IsNotEmpty, IsOptional, MaxLength, IsNumber, Min, Max, IsUUID, IsInt, IsEnum } from 'class-validator';


export class CreateProductOrderDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  // buyerId is NOT accepted from the client — injected automatically from the JWT token

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsOptional()
  orderNotes?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  sellerRatingValue?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  buyerRatingValue?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  transactionHash?: string;

}
