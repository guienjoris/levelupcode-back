import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonCompletionResultDto } from '../../lessons/dto/lesson-response.dto.js';

export class QuestionCorrectionDto {
  @ApiProperty({ example: 'q1b2c3d4-0000-0000-0000-000000000001' })
  questionId: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-000000000001' })
  selectedAnswerId: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-000000000001' })
  correctAnswerId: string;

  @ApiProperty({ example: true, description: 'True si la réponse choisie est la bonne' })
  isCorrect: boolean;

  @ApiPropertyOptional({
    example: 'Le décorateur @Module() permet d’enregistrer les métadonnées de structure...',
    description: 'Explication pédagogique de la réponse',
  })
  explanation?: string | null;
}

export class QuizResultDto {
  @ApiProperty({ example: 'z1b2c3d4-0000-0000-0000-000000000001' })
  quizId: string;

  @ApiProperty({ example: 100, description: 'Score obtenu en pourcentage (0 à 100)' })
  score: number;

  @ApiProperty({ example: true, description: 'True si le score est supérieur ou égal à 70%' })
  passed: boolean;

  @ApiProperty({ example: 2, description: 'Nombre total de questions' })
  totalQuestions: number;

  @ApiProperty({ example: 2, description: 'Nombre de bonnes réponses' })
  correctCount: number;

  @ApiProperty({
    type: [QuestionCorrectionDto],
    description: 'Correction détaillée pour chaque question avec explications',
  })
  corrections: QuestionCorrectionDto[];

  @ApiProperty({
    type: () => LessonCompletionResultDto,
    description: 'Statistiques de streak et XP mis à jour',
  })
  reward: LessonCompletionResultDto;
}
