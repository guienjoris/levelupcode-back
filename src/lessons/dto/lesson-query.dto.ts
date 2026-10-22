import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Difficulty } from '@prisma/client';

export class LessonQueryDto {
  @ApiPropertyOptional({
    enum: Difficulty,
    description:
      'Filtrer les leçons par niveau de difficulté (NOVICE, INTERMEDIAIRE, SENIOR)',
  })
  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;
}
