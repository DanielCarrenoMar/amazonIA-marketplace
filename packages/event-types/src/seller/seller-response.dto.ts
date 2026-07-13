export class SellerUserDto {
  id: string;
  fullName: string;
  username: string | null;
  email: string;
  age: number | null;
  nationality: string | null;
  avatarUrl: string | null;
  locationFormattedAddress: string | null;
  locationCity: string | null;
  locationRegion: string | null;
}

export class SellerResponseDto {
  id: string;
  tribeId: number | null;
  rating: number | null;
  description: string | null;
  avgProductRating: number | null;
  totalReviews: number;
  user?: SellerUserDto;
  tribe?: any; // TribeResponseDto
  ledTribeAsPrimary?: any; // TribeResponseDto
  ledTribeAsSecondary?: any; // TribeResponseDto
}
