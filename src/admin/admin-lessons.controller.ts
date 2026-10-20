import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminLessonsService } from './admin-lessons.service.js';
import { CreateLessonDto } from './dto/create-lesson.dto.js';
import { UpdateLessonDto } from './dto/update-lesson.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Admin - Lessons')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/lessons')
export class AdminLessonsController {
  constructor(private readonly adminLessonsService: AdminLessonsService) {}

  @Get()
  @ApiOperation({
    summary: 'Liste administrative de toutes les leçons (Admin uniquement)',
    description: 'Retourne l’ensemble des leçons avec statistiques de progression et quiz associés.',
  })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrer par UUID de catégorie' })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean, description: 'Filtrer par statut publié' })
  @ApiResponse({ status: 200, description: 'Liste des leçons' })
  @ApiResponse({ status: 403, description: 'Accès refusé : rôle ADMIN requis' })
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('isPublished') isPublished?: boolean,
  ) {
    return this.adminLessonsService.findAll({ categoryId, isPublished });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Détail administratif d’une leçon (Admin uniquement)',
  })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0' })
  @ApiResponse({ status: 200, description: 'Détail de la leçon' })
  @ApiResponse({ status: 404, description: 'Leçon introuvable' })
  async findOne(@Param('id') id: string) {
    return this.adminLessonsService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Création d’une nouvelle leçon (Admin uniquement)',
    description: 'Crée une nouvelle leçon Markdown rattachée à une catégorie.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Leçon créée avec succès' })
  @ApiResponse({ status: 409, description: 'Conflit : le slug est déjà utilisé' })
  @ApiResponse({ status: 404, description: 'Catégorie spécifiée introuvable' })
  async create(@Body() dto: CreateLessonDto) {
    return this.adminLessonsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mise à jour d’une leçon (Admin uniquement)',
    description: 'Permet de modifier le titre, slug, contenu Markdown, difficulté ou statut de publication.',
  })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0' })
  @ApiResponse({ status: 200, description: 'Leçon mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Leçon introuvable' })
  async update(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.adminLessonsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suppression définitive d’une leçon (Admin uniquement)',
  })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0' })
  @ApiResponse({ status: 200, description: 'Leçon supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Leçon introuvable' })
  async remove(@Param('id') id: string) {
    return this.adminLessonsService.remove(id);
  }
}
