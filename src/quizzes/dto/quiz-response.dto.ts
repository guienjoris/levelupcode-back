import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Difficulty } from '@prisma/client';

export class QuizAnswerOptionDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-000000000001' })
  id: string;

  @ApiProperty({ example: '@Module()' })
  text: string;

  @ApiProperty({ example: 1 })
  orderIndex: number;
}

export class QuizQuestionDto {
  @ApiProperty({ example: 'q1b2c3d4-0000-0000-0000-000000000001' })
  id: string;

  @ApiProperty({
    example: 'Quel décorateur est requis pour définir un module NestJS ?',
  })
  title: string;

  @ApiPropertyOptional({ example: '@Injectable()\nexport class MyService {}' })
  codeSnippet?: string | null;

  @ApiProperty({ example: 1 })
  orderIndex: number;

  @ApiProperty({
    type: [QuizAnswerOptionDto],
    description:
      'Propositions de réponses (la bonne réponse est masquée avant soumission)',
  })
  answers: QuizAnswerOptionDto[];
}

export class QuizDetailDto {
  @ApiProperty({ example: 'z1b2c3d4-0000-0000-0000-000000000001' })
  id: string;

  @ApiProperty({ example: 'Quiz : Les fondamentaux des Modules NestJS' })
  title: string;

  @ApiPropertyOptional({
    example: 'Testez vos connaissances sur le décorateur @Module...',
  })
  description?: string | null;

  @ApiProperty({ enum: Difficulty, example: Difficulty.NOVICE })
  difficulty: Difficulty;

  @ApiProperty({ example: 'c2b9d052-a5ec-44ec-b42e-13c5914fa61f' })
  categoryId: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0' })
  lessonId?: string | null;

  @ApiProperty({
    example: 5,
    description: 'Nombre total de questions dans le quiz',
  })
  questionsCount: number;

  @ApiProperty({ type: [QuizQuestionDto] })
  questions: QuizQuestionDto[];

  @ApiPropertyOptional({
    example: 80,
    description:
      'Meilleur score obtenu par l’utilisateur (en pourcentage) ou null',
  })
  userBestScore?: number | null;
}
