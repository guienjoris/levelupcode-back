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
import { AdminQuizzesService } from './admin-quizzes.service.js';
import { CreateQuizDto, CreateAdminQuestionDto } from './dto/create-quiz.dto.js';
import { UpdateQuizDto } from './dto/update-quiz.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Admin - Quizzes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/quizzes')
export class AdminQuizzesController {
  constructor(private readonly adminQuizzesService: AdminQuizzesService) {}

  @Get()
  @ApiOperation({
    summary: 'Liste administrative de tous les quiz (Admin uniquement)',
    description: 'Retourne la liste des quiz avec le nombre de questions et de participants.',
  })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrer par UUID de catégorie' })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean, description: 'Filtrer par statut publié' })
  @ApiResponse({ status: 200, description: 'Liste des quiz' })
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('isPublished') isPublished?: boolean,
  ) {
    return this.adminQuizzesService.findAll({ categoryId, isPublished });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Détail administratif d’un quiz avec ses questions et réponses (Admin uniquement)',
    description: 'Retourne l’ensemble des questions, options et indicateurs isCorrect pour l’édition.',
  })
  @ApiParam({ name: 'id', example: 'z1b2c3d4-0000-0000-0000-000000000001' })
  @ApiResponse({ status: 200, description: 'Détail complet du quiz' })
  @ApiResponse({ status: 404, description: 'Quiz introuvable' })
  async findOne(@Param('id') id: string) {
    return this.adminQuizzesService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Création d’un quiz avec ses questions/réponses (Admin uniquement)',
    description: 'Crée de façon atomique un quiz et l’ensemble de ses questions à choix multiples.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Quiz créé avec succès' })
  @ApiResponse({ status: 400, description: 'Question sans réponse exacte ou données invalides' })
  @ApiResponse({ status: 404, description: 'Catégorie ou leçon introuvable' })
  async create(@Body() dto: CreateQuizDto) {
    return this.adminQuizzesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mise à jour des métadonnées d’un quiz (Admin uniquement)',
  })
  @ApiParam({ name: 'id', example: 'z1b2c3d4-0000-0000-0000-000000000001' })
  @ApiResponse({ status: 200, description: 'Quiz mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Quiz introuvable' })
  async update(@Param('id') id: string, @Body() dto: UpdateQuizDto) {
    return this.adminQuizzesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suppression définitive d’un quiz et de ses questions en cascade (Admin uniquement)',
  })
  @ApiParam({ name: 'id', example: 'z1b2c3d4-0000-0000-0000-000000000001' })
  @ApiResponse({ status: 200, description: 'Quiz et questions supprimés avec succès' })
  @ApiResponse({ status: 404, description: 'Quiz introuvable' })
  async remove(@Param('id') id: string) {
    return this.adminQuizzesService.remove(id);
  }

  @Post(':id/questions')
  @ApiOperation({
    summary: 'Ajouter une question à un quiz existant (Admin uniquement)',
  })
  @ApiParam({ name: 'id', example: 'z1b2c3d4-0000-0000-0000-000000000001' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Question ajoutée avec succès' })
  async addQuestion(
    @Param('id') quizId: string,
    @Body() dto: CreateAdminQuestionDto,
  ) {
    return this.adminQuizzesService.addQuestion(quizId, dto);
  }

  @Delete('questions/:questionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer une question d’un quiz (Admin uniquement)',
  })
  @ApiParam({ name: 'questionId', example: 'q1b2c3d4-0000-0000-0000-000000000001' })
  @ApiResponse({ status: 200, description: 'Question supprimée avec succès' })
  async deleteQuestion(@Param('questionId') questionId: string) {
    return this.adminQuizzesService.deleteQuestion(questionId);
  }
}
