import { IsString, IsNotEmpty, IsOptional, IsInt, MinLength } from 'class-validator';

export class CreateProductCommentDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'El comentario debe tener al menos 3 caracteres.' })
  content: string;

  @IsOptional()
  @IsInt()
  parentCommentId?: number;
}
