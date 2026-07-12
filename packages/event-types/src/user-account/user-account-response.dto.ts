import { UserRole } from '../enums';

export class UserAccountResponseDto {
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
  avatarUrl: string | null;
  locationMapboxId: string | null;
  locationFormattedAddress: string | null;
  locationCity: string | null;
  locationRegion: string | null;
  createdAt: Date;
}
