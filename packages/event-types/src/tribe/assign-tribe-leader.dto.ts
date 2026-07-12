import { IsUUID } from 'class-validator';

export class AssignTribeLeaderDto {
  @IsUUID()
  sellerId: string;
}
