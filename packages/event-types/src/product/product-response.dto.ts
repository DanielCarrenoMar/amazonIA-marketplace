export class ProductElaborationStepResponseDto {
  id: number;
  productId: string;
  stepNumber: number;
  title: string | null;
  description: string;
  mediaUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class ProductResponseDto {
  id: string;
  sellerId: string;
  categoryId: number;
  name: string;
  description: string | null;
  price: any; // Decimal maps to Decimal type or string in JSON
  stockAvailable: number;
  imageUrl: string | null;
  imageUrls: string[];
  averageRating: any | null; // Decimal
  totalReviews: number;
  isActive: boolean;
  locationMapboxId: string | null;
  locationFormattedAddress: string | null;
  locationCity: string | null;
  locationRegion: string | null;
  elaborationText: string | null;
  elaborationMediaUrls: string[];
  isFragile: boolean;
  requiresColdChain: boolean;
  maxTemperatureCelsius: any | null; // Decimal
  maxHumidity: any | null; // Decimal
  createdAt: Date;
  updatedAt: Date;
  
  // Optional relations depending on the endpoint
  seller?: any; // SellerResponseDto
  category?: any; // ProductCategoryResponseDto
  elaborationSteps?: ProductElaborationStepResponseDto[];
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
