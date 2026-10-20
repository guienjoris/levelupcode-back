import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Difficulty } from '@prisma/client';

export class CreateLessonDto {
  @ApiProperty({
    example: 'introduction-aux-decorateurs-nestjs',
    description: 'Identifiant d’URL unique (slug en minuscules et tirets)',
  })
  @IsString({ message: 'Le slug doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le slug est obligatoire.' })
  slug: string;

  @ApiProperty({
    example: 'Introduction aux Décorateurs NestJS',
    description: 'Titre pédagogique de la leçon',
  })
  @IsString({ message: 'Le titre doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le titre est obligatoire.' })
  title: string;

  @ApiPropertyOptional({
    example: 'Découvrez le fonctionnement interne des décorateurs et du métaprogramming...',
    description: 'Courte description résumant les objectifs de la leçon',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: '# Les Décorateurs\n\nUn décorateur est une fonction qui applique le patron décorateur...',
    description: 'Contenu complet de la leçon au format Markdown',
  })
  @IsString({ message: 'Le contenu Markdown doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le contenu Markdown est obligatoire.' })
  contentMarkdown: string;

  @ApiProperty({
    enum: Difficulty,
    example: Difficulty.NOVICE,
    description: 'Niveau de difficulté (NOVICE, INTERMEDIAIRE, SENIOR)',
  })
  @IsEnum(Difficulty, { message: 'Niveau de difficulté invalide.' })
  difficulty: Difficulty;

  @ApiPropertyOptional({
    example: 1,
    default: 0,
    description: 'Ordre d’affichage dans la liste des leçons de la catégorie',
  })
  @IsInt({ message: 'L’ordre doit être un entier.' })
  @Min(0, { message: 'L’ordre doit être supérieur ou égal à 0.' })
  @IsOptional()
  orderIndex?: number;

  @ApiProperty({
    example: 'c2b9d052-a5ec-44ec-b42e-13c5914fa61f',
    description: 'UUID de la catégorie rattachée',
  })
  @IsUUID('4', { message: 'categoryId doit être un UUID v4 valide.' })
  @IsNotEmpty({ message: 'La catégorie est obligatoire.' })
  categoryId: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Statut de publication (visible par les apprenants si true)',
  })
  @IsBoolean({ message: 'isPublished doit être un booléen.' })
  @IsOptional()
  isPublished?: boolean;
}
