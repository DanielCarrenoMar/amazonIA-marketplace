import { IsUUID } from 'class-validator';

export class FindProposalParamsDto {
  @IsUUID('4')
  id: string;
}
