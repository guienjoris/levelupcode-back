import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { DonationsService } from './donations.service.js';
import { BmcWebhookDto } from './dto/bmc-webhook.dto.js';
import { BmcWebhookGuard } from './guards/bmc-webhook.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post('bmc-webhook')
  @HttpCode(HttpStatus.OK)
  @UseGuards(BmcWebhookGuard)
  @ApiHeader({
    name: 'x-bmc-secret',
    description: 'Secret partagé Buy Me a Coffee (ou en-tête Authorization Bearer / x-bmc-signature)',
    required: false,
  })
  @ApiOperation({
    summary: 'Webhook Buy Me a Coffee (Attribution automatique du badge supporter)',
    description:
      'Reçoit les notifications d’achat de café / don, enregistre la transaction et active le statut isSupporter sur le compte apprenant correspondant.',
  })
  @ApiResponse({
    status: 200,
    description: 'Donation traitée avec succès ou déjà existante (idempotence)',
  })
  @ApiResponse({
    status: 401,
    description: 'Signature ou secret webhook invalide ou manquant',
  })
  async handleBmcWebhook(@Body() payload: BmcWebhookDto) {
    return this.donationsService.handleBmcWebhook(payload);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Consulter mon statut Supporter et mes contributions (Membre connecté)',
    description:
      'Retourne l’historique des dons et l’état du badge Supporter pour le compte actuellement authentifié.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statut supporter et historique des dons',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getMyDonations(@CurrentUser('id') userId: string) {
    return this.donationsService.getMyDonations(userId);
  }

  @Get('supporters')
  @ApiOperation({
    summary: 'Mur des donateurs / contributeurs publics récents',
    description:
      'Retourne la liste des récents supporters avec leur prénom et message (emails masqués pour la confidentialité).',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Nombre de donateurs à retourner (défaut 20, max 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste publique des supporters récents',
  })
  async getRecentSupporters(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.donationsService.getRecentSupporters(limit || 20);
  }
}
