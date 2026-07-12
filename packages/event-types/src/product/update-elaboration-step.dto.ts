import { PartialType } from '@nestjs/mapped-types';
import { CreateElaborationStepDto } from './create-elaboration-step.dto';

export class UpdateElaborationStepDto extends PartialType(CreateElaborationStepDto) {}
