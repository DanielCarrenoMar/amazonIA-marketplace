export class ProductCommentUserDto {
  id: string;
  fullName: string;
}

export class ProductCommentResponseDto {
  id: number;
  productId: string;
  userId: string;
  content: string;
  parentCommentId: number | null;
  publishedAt: Date;
  user: ProductCommentUserDto;
  replies?: ProductCommentResponseDto[];
}
