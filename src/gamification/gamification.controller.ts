import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GamificationService } from './gamification.service.js';
import { UserStatsDto } from './dto/user-stats.dto.js';
import { LeaderboardQueryDto, LeaderboardEntryDto } from './dto/leaderboard.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Gamification')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Statistiques personnelles de l’apprenant connecté',
    description:
      'Retourne le streak actuel et record, l’XP total, les leçons/quiz complétés, l’ancienneté et la répartition XP par catégorie et tag.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques de l’apprenant',
    type: UserStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Accès non autorisé : authentification requise',
  })
  async getMyStats(@CurrentUser('id') userId: string): Promise<UserStatsDto> {
    return this.gamificationService.getUserStats(userId);
  }

  @Get('leaderboard')
  @ApiOperation({
    summary: 'Classement public des apprenants (Leaderboard)',
    description: 'Retourne le classement par XP total ou par record de streak avec pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Classement des apprenants',
    schema: {
      properties: {
        total: { type: 'number', example: 120 },
        entries: {
          type: 'array',
          items: { $ref: '#/components/schemas/LeaderboardEntryDto' },
        },
      },
    },
  })
  async getLeaderboard(@Query() query: LeaderboardQueryDto) {
    return this.gamificationService.getLeaderboard(query);
  }
}
