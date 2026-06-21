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
  locationMapboxId: string | null;
  locationFormattedAddress: string | null;
  locationCity: string | null;
  locationRegion: string | null;
  createdAt: Date;
  updatedAt: Date;
  seller?: any; // We can type this as SellerResponseDto later
  category?: any; // We can type this as ProductCategoryResponseDto later
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
