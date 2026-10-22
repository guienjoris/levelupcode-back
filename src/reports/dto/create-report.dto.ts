import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ReportType } from '@prisma/client';

export class CreateReportDto {
  @ApiProperty({
    enum: ReportType,
    example: ReportType.LESSON,
    description: 'Type de contenu signalé (LESSON ou QUIZ)',
  })
  @IsEnum(ReportType, {
    message: 'Le type de signalement doit être soit LESSON, soit QUIZ.',
  })
  type: ReportType;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Identifiant UUID ou slug de la leçon ou du quiz signalé',
  })
  @IsString({
    message: "L'identifiant de la cible doit être une chaîne de caractères.",
  })
  @IsNotEmpty({ message: "L'identifiant de la cible est obligatoire." })
  targetId: string;

  @ApiProperty({
    example:
      "Une erreur de syntaxe empêche l'exemple de compiler à la ligne 12.",
    description: "Explication détaillée de l'anomalie ou du problème rencontré",
  })
  @IsString({ message: 'Le commentaire doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le commentaire explicatif est obligatoire.' })
  @MaxLength(2000, {
    message: 'Le commentaire ne peut pas dépasser 2000 caractères.',
  })
  comment: string;
}
