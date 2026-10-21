import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DonationsService } from './donations.service.js';
import { QueryDonationsDto } from './dto/query-donations.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Admin - Donations')
@Controller('admin/donations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminDonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les dons reçus et statistiques financières (Admin)',
    description:
      'Retourne la liste paginée des transactions Buy Me a Coffee avec recherche par email et statistiques globales (montant total récolté, nombre de dons).',
  })
  @ApiResponse({
    status: 200,
    description: 'Historique des dons et indicateurs financiers',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé (ADMIN requis)' })
  async findAll(@Query() query: QueryDonationsDto) {
    return this.donationsService.findAll(query);
  }
}
