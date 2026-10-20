import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateQuizDto } from './create-quiz.dto.js';

export class UpdateQuizDto extends PartialType(
  OmitType(CreateQuizDto, ['questions'] as const),
) {}
