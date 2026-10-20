import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TagDto {
  @ApiProperty({ example: 'b1a8d052-a5ec-44ec-b42e-13c5914fa61e' })
  id: string;

  @ApiProperty({ example: 'front-end' })
  slug: string;

  @ApiProperty({ example: 'Front-End' })
  name: string;
}

export class CategorySummaryDto {
  @ApiProperty({ example: 'c2b9d052-a5ec-44ec-b42e-13c5914fa61f' })
  id: string;

  @ApiProperty({ example: 'nestjs' })
  slug: string;

  @ApiProperty({ example: 'NestJS' })
  name: string;

  @ApiPropertyOptional({
    example: 'Framework back-end modulaire, injection de dépendances...',
  })
  description?: string | null;

  @ApiPropertyOptional({ example: 'logos:nestjs' })
  icon?: string | null;

  @ApiProperty({ example: 4 })
  orderIndex: number;

  @ApiProperty({ type: [TagDto] })
  tags: TagDto[];

  @ApiProperty({ example: 12, description: 'Nombre total de leçons publiées' })
  lessonsCount: number;

  @ApiProperty({ example: 6, description: 'Nombre total de quiz disponibles' })
  quizzesCount: number;
}
