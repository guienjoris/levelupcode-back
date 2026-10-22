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
import { AdminTagsService } from './admin-tags.service.js';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { UpdateTagDto } from './dto/update-tag.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Admin - Tags')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/tags')
export class AdminTagsController {
  constructor(private readonly adminTagsService: AdminTagsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Liste administrative de tous les tags techniques (Admin uniquement)',
    description:
      'Retourne l’ensemble des tags techniques avec leurs catégories associées.',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filtrer par UUID de catégorie',
  })
  @ApiResponse({ status: 200, description: 'Liste des tags' })
  @ApiResponse({ status: 403, description: 'Accès refusé : rôle ADMIN requis' })
  async findAll(@Query('categoryId') categoryId?: string) {
    return this.adminTagsService.findAll({ categoryId });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Détail administratif d’un tag technique (Admin uniquement)',
  })
  @ApiParam({ name: 'id', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @ApiResponse({ status: 200, description: 'Détail du tag' })
  @ApiResponse({ status: 404, description: 'Tag introuvable' })
  async findOne(@Param('id') id: string) {
    return this.adminTagsService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Création d’un nouveau tag technique (Admin uniquement)',
    description:
      'Crée un nouveau tag technique avec possibilité d’association immédiate à des catégories existantes.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tag créé avec succès',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflit : le slug est déjà utilisé',
  })
  @ApiResponse({
    status: 404,
    description: 'Une ou plusieurs catégories spécifiées sont introuvables',
  })
  async create(@Body() dto: CreateTagDto) {
    return this.adminTagsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mise à jour d’un tag technique (Admin uniquement)',
    description:
      'Permet de modifier le nom, le slug ou les catégories associées.',
  })
  @ApiParam({ name: 'id', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @ApiResponse({ status: 200, description: 'Tag mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Tag introuvable' })
  @ApiResponse({
    status: 409,
    description: 'Conflit : le slug est déjà utilisé',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.adminTagsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suppression définitive d’un tag technique (Admin uniquement)',
  })
  @ApiParam({ name: 'id', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @ApiResponse({ status: 200, description: 'Tag supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Tag introuvable' })
  async remove(@Param('id') id: string) {
    return this.adminTagsService.remove(id);
  }
}
