import { PartialType } from '@nestjs/mapped-types';
import { CreateTribeDto } from './create-tribe.dto';

export class UpdateTribeDto extends PartialType(CreateTribeDto) {}
