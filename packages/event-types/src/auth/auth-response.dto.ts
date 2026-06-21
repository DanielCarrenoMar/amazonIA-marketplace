import { UserRole } from '../enums';

export class AuthUserDto {
  id: string;
  email: string;
  fullName: string;
  username: string | null;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}

export class UserMeResponseDto {
  id: string;
  email: string;
  fullName: string;
  username: string | null;
  nationalId: string;
  age: number | null;
  nationality: string | null;
  role: UserRole;
  phonePrimary: string | null;
  phoneSecondary: string | null;
  walletHash: string | null;
  locationMapboxId: string | null;
  locationFormattedAddress: string | null;
  locationCity: string | null;
  locationRegion: string | null;
  createdAt: Date;
  seller?: any | null; // We can type this later or leave as any/object for now if we don't have SellerDto here yet
}
