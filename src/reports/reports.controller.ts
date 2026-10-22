import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { ReportsService } from './reports.service.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserFromToken } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard, OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // Max 5 signalements par IP / 5 minutes
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Signaler une erreur ou coquille pédagogique (Public / Membres)',
    description:
      'Enregistre un signalement sur une leçon ou un quiz et prévient immédiatement l’administrateur par email. Limité à 5 requêtes par période de 5 minutes par adresse IP.',
  })
  @ApiResponse({
    status: 201,
    description: 'Signalement créé avec succès et transmis à l’administrateur',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example:
            'Votre signalement a été enregistré avec succès et transmis à l’administrateur.',
        },
        report: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'report-uuid' },
            type: { type: 'string', example: 'LESSON' },
            targetId: { type: 'string', example: 'target-uuid' },
            comment: { type: 'string', example: 'Erreur sur le snippet' },
            status: { type: 'string', example: 'PENDING' },
            createdAt: { type: 'string', example: '2026-10-21T08:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'La leçon ou le quiz cible n’existe pas',
  })
  @ApiResponse({
    status: 429,
    description:
      'Trop de requêtes : limite de 5 signalements atteinte pour cette période',
  })
  async create(
    @Body() dto: CreateReportDto,
    @CurrentUser() user: UserFromToken | null,
  ) {
    return this.reportsService.create(dto, user);
  }
}
