import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
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
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminCategoriesService } from './admin-categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Admin - Categories')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(
    private readonly adminCategoriesService: AdminCategoriesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Liste administrative de toutes les catégories (Admin uniquement)',
    description:
      'Retourne l’ensemble des catégories avec leurs tags associés et le décompte de contenus.',
  })
  @ApiResponse({ status: 200, description: 'Liste des catégories' })
  @ApiResponse({ status: 403, description: 'Accès refusé : rôle ADMIN requis' })
  async findAll() {
    return this.adminCategoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Détail administratif d’une catégorie (Admin uniquement)',
  })
  @ApiParam({ name: 'id', example: 'c2b9d052-a5ec-44ec-b42e-13c5914fa61f' })
  @ApiResponse({ status: 200, description: 'Détail de la catégorie' })
  @ApiResponse({ status: 404, description: 'Catégorie introuvable' })
  async findOne(@Param('id') id: string) {
    return this.adminCategoriesService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Création d’une nouvelle catégorie (Admin uniquement)',
    description:
      'Crée une nouvelle catégorie d’apprentissage avec possibilité d’y lier immédiatement des tags.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Catégorie créée avec succès',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflit : le slug est déjà utilisé',
  })
  @ApiResponse({
    status: 404,
    description: 'Un ou plusieurs tags spécifiés sont introuvables',
  })
  async create(@Body() dto: CreateCategoryDto) {
    return this.adminCategoriesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mise à jour d’une catégorie (Admin uniquement)',
    description:
      'Permet de modifier le nom, slug, description, icône, ordre ou tags rattachés.',
  })
  @ApiParam({ name: 'id', example: 'c2b9d052-a5ec-44ec-b42e-13c5914fa61f' })
  @ApiResponse({
    status: 200,
    description: 'Catégorie mise à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Catégorie introuvable' })
  @ApiResponse({
    status: 409,
    description: 'Conflit : le slug est déjà utilisé',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.adminCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suppression définitive d’une catégorie (Admin uniquement)',
  })
  @ApiParam({ name: 'id', example: 'c2b9d052-a5ec-44ec-b42e-13c5914fa61f' })
  @ApiResponse({ status: 200, description: 'Catégorie supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Catégorie introuvable' })
  async remove(@Param('id') id: string) {
    return this.adminCategoriesService.remove(id);
  }

  @Post(':id/tags/:tagId')
  @ApiOperation({
    summary: 'Associer un tag à une catégorie (Admin uniquement)',
  })
  @ApiParam({ name: 'id', example: 'c2b9d052-a5ec-44ec-b42e-13c5914fa61f' })
  @ApiParam({ name: 'tagId', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tag associé avec succès',
  })
  @ApiResponse({ status: 404, description: 'Catégorie ou tag introuvable' })
  async attachTag(
    @Param('id') categoryId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.adminCategoriesService.attachTag(categoryId, tagId);
  }

  @Delete(':id/tags/:tagId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dissocier un tag d’une catégorie (Admin uniquement)',
  })
  @ApiParam({ name: 'id', example: 'c2b9d052-a5ec-44ec-b42e-13c5914fa61f' })
  @ApiParam({ name: 'tagId', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @ApiResponse({ status: 200, description: 'Tag dissocié avec succès' })
  @ApiResponse({ status: 404, description: 'Association introuvable' })
  async detachTag(
    @Param('id') categoryId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.adminCategoriesService.detachTag(categoryId, tagId);
  }
}
