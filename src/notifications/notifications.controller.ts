import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
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
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service.js';
import { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto.js';
import { CronSecretGuard } from './guards/cron-secret.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send-daily-reminders')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CronSecretGuard)
  @ApiHeader({
    name: 'x-cron-secret',
    description: 'Secret d’autorisation partagé avec Cloud Scheduler (Bearer <token> ou valeur brute)',
    required: true,
  })
  @ApiOperation({
    summary: 'Déclencheur automatique des rappels de streak (Cloud Scheduler / Cron)',
    description:
      'Scanne les apprenants inactifs aujourd’hui et envoie les emails de relance pour préserver leur streak.',
  })
  @ApiResponse({
    status: 200,
    description: 'Rappels traités avec succès',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        totalEligible: { type: 'number', example: 45 },
        sentCount: { type: 'number', example: 38 },
        skippedCount: { type: 'number', example: 7 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Secret de cron manquant ou invalide' })
  async sendDailyReminders() {
    return this.notificationsService.sendDailyReminders();
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Mise à jour des préférences de rappel email (Membres connectés)',
    description: 'Active ou désactive la réception de l’email quotidien de rappel de streak.',
  })
  @ApiResponse({
    status: 200,
    description: 'Préférences mises à jour',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        emailDailyReminder: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(userId, dto.emailDailyReminder);
  }

  @Get('unsubscribe')
  @ApiOperation({
    summary: 'Désinscription en 1 clic des rappels quotidiens',
    description: 'Permet à un utilisateur de se désinscrire directement depuis le lien présent dans l’email reçu.',
  })
  @ApiQuery({ name: 'token', description: 'Jeton de désinscription chiffré' })
  @ApiResponse({ status: 200, description: 'Désinscription confirmée' })
  @ApiResponse({ status: 400, description: 'Jeton invalide' })
  async unsubscribe(@Query('token') token: string) {
    return this.notificationsService.unsubscribeByToken(token);
  }
}
