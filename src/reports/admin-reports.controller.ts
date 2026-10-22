import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service.js';
import { QueryReportsDto } from './dto/query-reports.dto.js';
import { UpdateReportStatusDto } from './dto/update-report-status.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Admin - Reports')
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister et filtrer tous les signalements d’erreurs (Admin)',
    description:
      'Retourne la liste paginée des signalements, avec possibilité de filtrer par statut et type de contenu.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des signalements',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé (ADMIN requis)' })
  async findAll(@Query() query: QueryReportsDto) {
    return this.reportsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consulter un signalement détaillé (Admin)',
    description:
      'Retourne le signalement avec les détails de la ressource concernée (titre de la leçon ou du quiz).',
  })
  @ApiParam({ name: 'id', description: 'UUID du signalement' })
  @ApiResponse({ status: 200, description: 'Détails du signalement' })
  @ApiResponse({ status: 404, description: 'Signalement introuvable' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour le statut d’un signalement (Admin)',
    description:
      'Permet de passer un signalement à PENDING, RESOLVED ou DISMISSED.',
  })
  @ApiParam({ name: 'id', description: 'UUID du signalement' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  @ApiResponse({ status: 404, description: 'Signalement introuvable' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportStatusDto,
  ) {
    return this.reportsService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un signalement d’erreur (Admin)',
    description:
      'Supprime définitivement un signalement de la base de données.',
  })
  @ApiParam({ name: 'id', description: 'UUID du signalement' })
  @ApiResponse({ status: 200, description: 'Signalement supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Signalement introuvable' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.delete(id);
  }
}
