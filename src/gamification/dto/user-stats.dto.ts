import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryXpDto {
  @ApiProperty({ example: 'c2b9d052-a5ec-44ec-b42e-13c5914fa61f' })
  categoryId: string;

  @ApiProperty({ example: 'NestJS' })
  categoryName: string;

  @ApiProperty({ example: 'nestjs' })
  categorySlug: string;

  @ApiProperty({
    example: 120,
    description: 'Points XP accumulés dans cette catégorie',
  })
  xp: number;
}

export class TagXpDto {
  @ApiProperty({ example: 't1a8d052-a5ec-44ec-b42e-13c5914fa61e' })
  tagId: string;

  @ApiProperty({ example: 'Back-End' })
  tagName: string;

  @ApiProperty({ example: 'back-end' })
  tagSlug: string;

  @ApiProperty({ example: 120, description: 'Points XP accumulés sur ce tag' })
  xp: number;
}

export class UserStatsDto {
  @ApiProperty({ example: 'u1a8d052-a5ec-44ec-b42e-13c5914fa61e' })
  userId: string;

  @ApiProperty({
    example: 5,
    description: 'Série de jours consécutifs actuelle',
  })
  currentStreak: number;

  @ApiProperty({ example: 14, description: 'Record de jours consécutifs' })
  longestStreak: number;

  @ApiPropertyOptional({ example: '2026-10-20T08:00:00.000Z' })
  lastActiveDate?: Date | null;

  @ApiProperty({
    example: 350,
    description: 'Total des points XP gagnés sur la plateforme',
  })
  totalXp: number;

  @ApiProperty({ example: 18, description: 'Nombre total de leçons terminées' })
  completedLessonsCount: number;

  @ApiProperty({ example: 8, description: 'Nombre total de quiz validés' })
  completedQuizzesCount: number;

  @ApiProperty({
    example: 24,
    description: 'Nombre de jours écoulés depuis l’inscription',
  })
  daysSinceRegistration: number;

  @ApiProperty({
    example: false,
    description: 'Statut de donateur Buy Me a Coffee',
  })
  isSupporter: boolean;

  @ApiProperty({
    type: [CategoryXpDto],
    description: 'Répartition des XP par catégorie',
  })
  xpByCategory: CategoryXpDto[];

  @ApiProperty({
    type: [TagXpDto],
    description: 'Répartition des XP par tag technique',
  })
  xpByTag: TagXpDto[];
}
