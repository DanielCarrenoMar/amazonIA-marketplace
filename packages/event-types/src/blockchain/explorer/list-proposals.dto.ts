import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/pagination.dto';
import { ProposalStatusEnum } from '../blockchain.dto';

export class ListProposalsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ProposalStatusEnum, {
    message: 'status must be one of: PENDING, CONFIRMED, VETOED',
  })
  status?: ProposalStatusEnum;
}
