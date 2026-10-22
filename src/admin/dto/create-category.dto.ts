import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'docker',
    description: 'Identifiant d’URL unique (slug en minuscules et tirets)',
  })
  @IsString({ message: 'Le slug doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le slug est obligatoire.' })
  slug: string;

  @ApiProperty({
    example: 'Docker & Conteneurs',
    description: 'Nom lisible de la catégorie pédagogique',
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le nom est obligatoire.' })
  name: string;

  @ApiPropertyOptional({
    example:
      'Maîtrisez Docker, les Dockerfiles, Docker Compose et la conteneurisation.',
    description: 'Description pédagogique de la catégorie',
  })
  @IsString({ message: 'La description doit être une chaîne de caractères.' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'logos:docker-icon',
    description: 'Identifiant d’icône Iconify (ex: logos:docker-icon)',
  })
  @IsString({ message: 'L’icône doit être une chaîne de caractères.' })
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({
    example: 10,
    default: 0,
    description: 'Ordre d’affichage dans le catalogue des catégories',
  })
  @IsInt({ message: 'L’ordre doit être un entier.' })
  @Min(0, { message: 'L’ordre doit être supérieur ou égal à 0.' })
  @IsOptional()
  orderIndex?: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'],
    description:
      'Liste des identifiants UUID des tags à associer à cette catégorie',
  })
  @IsArray({ message: 'tagIds doit être un tableau.' })
  @IsUUID('4', {
    each: true,
    message: 'Chaque tagId doit être un UUID v4 valide.',
  })
  @IsOptional()
  tagIds?: string[];
}
