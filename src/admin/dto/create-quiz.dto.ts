import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Difficulty } from '@prisma/client';

export class CreateAdminAnswerDto {
  @ApiProperty({
    example: 'Une fonction qui applique le patron décorateur en annotant une classe.',
    description: 'Intitulé textuel de la proposition de réponse',
  })
  @IsString({ message: 'Le texte de la réponse doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le texte de la réponse est obligatoire.' })
  text: string;

  @ApiProperty({
    example: true,
    description: 'Indique s’il s’agit de la bonne réponse',
  })
  @IsBoolean({ message: 'isCorrect doit être un booléen.' })
  isCorrect: boolean;

  @ApiPropertyOptional({
    example: 1,
    default: 0,
    description: 'Ordre d’affichage de la réponse',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;
}

export class CreateAdminQuestionDto {
  @ApiProperty({
    example: 'Quel mot-clé TypeScript active l’utilisation des décorateurs ?',
    description: 'Énoncé de la question',
  })
  @IsString({ message: 'L’énoncé de la question doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'L’énoncé de la question est obligatoire.' })
  title: string;

  @ApiPropertyOptional({
    example: '@Injectable()\nexport class MyService {}',
    description: 'Extrait de code optionnel illustrant la question',
  })
  @IsString()
  @IsOptional()
  codeSnippet?: string;

  @ApiPropertyOptional({
    example: 'L’option experimentalDecorators du tsconfig.json active les décorateurs TS classiques.',
    description: 'Explication pédagogique affichée à l’apprenant après soumission',
  })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({
    example: 1,
    default: 0,
    description: 'Ordre de la question dans le quiz',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;

  @ApiProperty({
    type: [CreateAdminAnswerDto],
    description: 'Liste des propositions de réponses (minimum 2 réponses dont au moins 1 exacte)',
  })
  @IsArray({ message: 'Les réponses doivent être un tableau.' })
  @ArrayMinSize(2, { message: 'Chaque question doit comporter au moins 2 propositions de réponse.' })
  @ValidateNested({ each: true })
  @Type(() => CreateAdminAnswerDto)
  answers: CreateAdminAnswerDto[];
}

export class CreateQuizDto {
  @ApiProperty({
    example: 'Quiz : Les Décorateurs NestJS',
    description: 'Titre principal du quiz',
  })
  @IsString({ message: 'Le titre du quiz doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le titre du quiz est obligatoire.' })
  title: string;

  @ApiPropertyOptional({
    example: 'Évaluez vos compétences sur la métaprogrammation et les décorateurs NestJS.',
    description: 'Description du quiz',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: Difficulty,
    example: Difficulty.NOVICE,
    description: 'Niveau de difficulté du quiz',
  })
  @IsEnum(Difficulty, { message: 'Niveau de difficulté invalide.' })
  difficulty: Difficulty;

  @ApiProperty({
    example: 'c2b9d052-a5ec-44ec-b42e-13c5914fa61f',
    description: 'UUID de la catégorie rattachée',
  })
  @IsUUID('4', { message: 'categoryId doit être un UUID v4 valide.' })
  @IsNotEmpty({ message: 'La catégorie est obligatoire.' })
  categoryId: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
    description: 'UUID optionnel de la leçon associée à ce quiz',
  })
  @IsUUID('4', { message: 'lessonId doit être un UUID v4 valide.' })
  @IsOptional()
  lessonId?: string;

  @ApiPropertyOptional({
    example: 1,
    default: 0,
    description: 'Ordre d’affichage du quiz dans la catégorie',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Statut de publication',
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiProperty({
    type: [CreateAdminQuestionDto],
    description: 'Liste des questions associées à ce quiz (au moins 1 question requise)',
  })
  @IsArray({ message: 'Les questions doivent être fournies sous forme de tableau.' })
  @ArrayMinSize(1, { message: 'Le quiz doit comporter au moins 1 question.' })
  @ValidateNested({ each: true })
  @Type(() => CreateAdminQuestionDto)
  questions: CreateAdminQuestionDto[];
}
