import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTagDto {
  @ApiProperty({
    example: 'devops',
    description: 'Identifiant d’URL unique (slug en minuscules et tirets)',
  })
  @IsString({ message: 'Le slug doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le slug est obligatoire.' })
  slug: string;

  @ApiProperty({
    example: 'DevOps',
    description: 'Nom lisible du tag technique',
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le nom est obligatoire.' })
  name: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['c2b9d052-a5ec-44ec-b42e-13c5914fa61f'],
    description:
      'Liste des identifiants UUID des catégories à associer à ce tag',
  })
  @IsArray({ message: 'categoryIds doit être un tableau.' })
  @IsUUID('4', {
    each: true,
    message: 'Chaque categoryId doit être un UUID v4 valide.',
  })
  @IsOptional()
  categoryIds?: string[];
}
