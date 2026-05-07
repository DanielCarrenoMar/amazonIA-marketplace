import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserAccountDto } from './create-user-account.dto';

export class UpdateUserAccountDto extends PartialType(
  OmitType(CreateUserAccountDto, ['password'] as const),
) {}
