import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { LessonsService } from './lessons.service.js';
import { LessonQueryDto } from './dto/lesson-query.dto.js';
import {
  LessonSummaryDto,
  LessonDetailDto,
  LessonCompletionResultDto,
} from './dto/lesson-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Lessons')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller()
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get('categories/:slug/lessons')
  @ApiOperation({
    summary: 'Liste des leçons d’une catégorie (Membres connectés uniquement)',
    description:
      'Retourne la liste des leçons publiées d’une catégorie avec l’état de complétion pour l’utilisateur connecté.',
  })
  @ApiParam({ name: 'slug', example: 'nestjs', description: 'Slug de la catégorie' })
  @ApiResponse({
    status: 200,
    description: 'Liste des leçons de la catégorie',
    type: [LessonSummaryDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Accès non autorisé : inscription / authentification requise',
  })
  @ApiResponse({
    status: 404,
    description: 'Catégorie introuvable',
  })
  async findByCategory(
    @Param('slug') slug: string,
    @CurrentUser('id') userId: string,
    @Query() query: LessonQueryDto,
  ): Promise<LessonSummaryDto[]> {
    return this.lessonsService.findByCategory(slug, userId, query.difficulty);
  }

  @Get('lessons/:idOrSlug')
  @ApiOperation({
    summary: 'Lecture complète d’une leçon (Membres connectés uniquement)',
    description:
      'Retourne le contenu Markdown intégral et les métadonnées de la leçon demandée.',
  })
  @ApiParam({
    name: 'idOrSlug',
    example: 'introduction-aux-modules-nestjs',
    description: 'UUID ou slug de la leçon',
  })
  @ApiResponse({
    status: 200,
    description: 'Contenu complet de la leçon',
    type: LessonDetailDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Accès non autorisé : inscription / authentification requise',
  })
  @ApiResponse({
    status: 404,
    description: 'Leçon introuvable',
  })
  async findOne(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser('id') userId: string,
  ): Promise<LessonDetailDto> {
    return this.lessonsService.findOne(idOrSlug, userId);
  }

  @Post('lessons/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validation de lecture d’une leçon (Membres connectés uniquement)',
    description:
      'Enregistre la complétion de la leçon, met à jour le streak quotidien et crédite les points XP.',
  })
  @ApiParam({
    name: 'id',
    example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
    description: 'UUID de la leçon à valider',
  })
  @ApiResponse({
    status: 200,
    description: 'Leçon validée, streak et XP mis à jour',
    type: LessonCompletionResultDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Accès non autorisé : inscription / authentification requise',
  })
  @ApiResponse({
    status: 404,
    description: 'Leçon introuvable',
  })
  async completeLesson(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<LessonCompletionResultDto> {
    return this.lessonsService.completeLesson(id, userId);
  }
}
