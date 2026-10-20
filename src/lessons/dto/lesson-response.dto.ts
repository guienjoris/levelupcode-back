import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Difficulty } from '@prisma/client';

export class LessonSummaryDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0' })
  id: string;

  @ApiProperty({ example: 'introduction-aux-modules-nestjs' })
  slug: string;

  @ApiProperty({ example: 'Introduction aux Modules dans NestJS' })
  title: string;

  @ApiPropertyOptional({
    example: 'Comprendre le rôle des modules et la structure d’une application NestJS.',
  })
  description?: string | null;

  @ApiProperty({ enum: Difficulty, example: Difficulty.NOVICE })
  difficulty: Difficulty;

  @ApiProperty({ example: 1 })
  orderIndex: number;

  @ApiProperty({ example: 'c2b9d052-a5ec-44ec-b42e-13c5914fa61f' })
  categoryId: string;

  @ApiProperty({ example: false, description: 'Indique si l’utilisateur a déjà validé cette leçon' })
  isCompleted: boolean;

  @ApiProperty({ example: true, description: 'Indique si un quiz est rattaché à cette leçon' })
  hasQuiz: boolean;
}

export class LessonDetailDto extends LessonSummaryDto {
  @ApiProperty({
    example: '# Les Modules dans NestJS\n\nUn module est une classe annotée avec le décorateur `@Module()`...',
    description: 'Contenu pédagogique complet au format Markdown',
  })
  contentMarkdown: string;

  @ApiProperty({ example: 'NestJS' })
  categoryName: string;

  @ApiPropertyOptional({
    example: 'd3c4b5a6-1234-5678-90ab-cdef12345678',
    description: 'ID du quiz associé s’il existe',
  })
  quizId?: string | null;
}

export class LessonCompletionResultDto {
  @ApiProperty({ example: true, description: 'True s’il s’agit de la première complétion' })
  isNewCompletion: boolean;

  @ApiProperty({ example: 10, description: 'Points XP attribués (0 si déjà validé)' })
  xpEarned: number;

  @ApiProperty({ example: 3, description: 'Série de jours consécutifs actuelle' })
  currentStreak: number;

  @ApiProperty({ example: 7, description: 'Plus longue série enregistrée' })
  longestStreak: number;
}
