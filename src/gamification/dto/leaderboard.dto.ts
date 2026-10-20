import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class LeaderboardEntryDto {
  @ApiProperty({ example: 1, description: 'Position dans le classement' })
  rank: number;

  @ApiProperty({ example: 'u1a8d052-a5ec-44ec-b42e-13c5914fa61e' })
  userId: string;

  @ApiProperty({ example: 'Alex Dupont' })
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  avatarUrl?: string | null;

  @ApiProperty({ example: 850, description: 'Total d’XP cumulé' })
  totalXp: number;

  @ApiProperty({ example: 12, description: 'Série en cours' })
  currentStreak: number;

  @ApiProperty({ example: 30, description: 'Record de série' })
  longestStreak: number;

  @ApiProperty({ example: true, description: 'Badge supporter BMC' })
  isSupporter: boolean;
}

export class LeaderboardQueryDto {
  @ApiPropertyOptional({
    example: 20,
    default: 20,
    description: 'Nombre maximum d’apprenants à retourner (1 à 100)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
    description: 'Décalage pour la pagination',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;

  @ApiPropertyOptional({
    example: 'xp',
    default: 'xp',
    enum: ['xp', 'streak'],
    description: 'Critère de tri du classement (xp ou streak)',
  })
  @IsIn(['xp', 'streak'])
  @IsOptional()
  sortBy?: 'xp' | 'streak' = 'xp';
}
