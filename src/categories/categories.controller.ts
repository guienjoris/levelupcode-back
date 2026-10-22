import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { CategorySummaryDto } from './dto/category-response.dto.js';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Catalogue public des catégories d’apprentissage',
    description:
      'Retourne la liste des 9 catégories officielles avec leurs tags et compteurs de contenu.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des catégories récupérée avec succès',
    type: [CategorySummaryDto],
  })
  async findAll(): Promise<CategorySummaryDto[]> {
    return this.categoriesService.findAll();
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Détail d’une catégorie par son slug',
    description:
      'Retourne les informations d’une catégorie spécifique (ex: javascript, nestjs, react).',
  })
  @ApiParam({
    name: 'slug',
    example: 'nestjs',
    description: 'Slug de la catégorie',
  })
  @ApiResponse({
    status: 200,
    description: 'Catégorie trouvée',
    type: CategorySummaryDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Catégorie introuvable',
  })
  async findBySlug(@Param('slug') slug: string): Promise<CategorySummaryDto> {
    return this.categoriesService.findBySlug(slug);
  }
}
