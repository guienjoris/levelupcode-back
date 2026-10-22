import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';

export class QuestionAnswerSubmissionDto {
  @ApiProperty({
    example: 'q1b2c3d4-0000-0000-0000-000000000001',
    description: 'UUID de la question',
  })
  @IsUUID('4', { message: 'questionId doit être un UUID v4 valide.' })
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({
    example: 'a1b2c3d4-0000-0000-0000-000000000001',
    description: 'UUID de la réponse sélectionnée par l’apprenant',
  })
  @IsUUID('4', { message: 'selectedAnswerId doit être un UUID v4 valide.' })
  @IsNotEmpty()
  selectedAnswerId: string;
}

export class SubmitQuizDto {
  @ApiProperty({
    type: [QuestionAnswerSubmissionDto],
    description:
      'Liste des réponses sélectionnées pour chaque question du quiz',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswerSubmissionDto)
  answers: QuestionAnswerSubmissionDto[];
}
