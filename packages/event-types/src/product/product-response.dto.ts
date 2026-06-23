export class ProductResponseDto {
  id: string;
  sellerId: string;
  categoryId: number;
  name: string;
  description: string | null;
  price: any; // Decimal maps to Decimal type or string in JSON
  stockAvailable: number;
  imageUrl: string | null;
  averageRating: any | null; // Decimal
  totalReviews: number;
  isActive: boolean;
  locationMapboxId: string | null;
  locationFormattedAddress: string | null;
  locationCity: string | null;
  locationRegion: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Optional relations depending on the endpoint
  seller?: any; // SellerResponseDto
  category?: any; // ProductCategoryResponseDto
}

export class NearbyProductResponseDto {
  id: string;
  name: string;
  description: string | null;
  price: any;
  stockAvailable: number;
  averageRating: any | null;
  locationCity: string | null;
  locationRegion: string | null;
  distanceKm: number;
}
