import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Parcours les apprenants ayant activé les rappels et n'ayant pas encore validé
   * d'exercice dans la journée en cours. Envoie les emails de relance par batch.
   */
  async sendDailyReminders(): Promise<{
    success: boolean;
    totalEligible: number;
    sentCount: number;
    skippedCount: number;
  }> {
    const now = new Date();
    // Début de la journée calendaire UTC actuelle
    const todayMidnight = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    // 1. Récupération des utilisateurs éligibles (préférence activée et pas encore relancés aujourd'hui)
    const eligibleUsers = await this.prisma.user.findMany({
      where: {
        emailDailyReminder: true,
        OR: [
          { lastReminderEmailSentAt: null },
          { lastReminderEmailSentAt: { lt: todayMidnight } },
        ],
      },
      include: {
        streak: true,
      },
    });

    let sentCount = 0;
    let skippedCount = 0;

    for (const user of eligibleUsers) {
      const lastActive = user.streak?.lastActiveDate;
      const isAlreadyActiveToday =
        lastActive && lastActive.getTime() >= todayMidnight.getTime();

      if (isAlreadyActiveToday) {
        // L'apprenant a déjà complété un exercice aujourd'hui, pas besoin de le relancer
        skippedCount += 1;
        continue;
      }

      // Génération de l'URL de désinscription en 1 clic
      const unsubscribeToken = this.generateUnsubscribeToken(user.id);
      const apiUrl =
        this.configService.get<string>('API_PUBLIC_URL') || 'http://localhost:3000';
      const unsubscribeUrl = `${apiUrl}/notifications/unsubscribe?token=${unsubscribeToken}`;

      const sent = await this.mailService.sendStreakReminder({
        to: user.email,
        name: user.name,
        currentStreak: user.streak?.currentStreak ?? 0,
        unsubscribeUrl,
      });

      if (sent) {
        sentCount += 1;
        // Marquer l'horodatage d'envoi pour éviter tout doublon dans la même journée
        await this.prisma.user.update({
          where: { id: user.id },
          data: { lastReminderEmailSentAt: now },
        });
      }
    }

    this.logger.log(
      `Rappels quotidiens terminés : ${sentCount} envoyés, ${skippedCount} déjà actifs, ${eligibleUsers.length} analysés.`,
    );

    return {
      success: true,
      totalEligible: eligibleUsers.length,
      sentCount,
      skippedCount,
    };
  }

  async updatePreferences(
    userId: string,
    emailDailyReminder: boolean,
  ): Promise<{ success: boolean; emailDailyReminder: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { emailDailyReminder },
      select: { emailDailyReminder: true },
    });

    return {
      success: true,
      emailDailyReminder: updated.emailDailyReminder,
    };
  }

  async unsubscribeByToken(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userId] = decoded.split(':');

      if (!userId) {
        throw new BadRequestException('Token de désinscription invalide.');
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { emailDailyReminder: false },
      });

      return {
        success: true,
        message: 'Vous avez été désinscrit avec succès des rappels quotidiens par email.',
      };
    } catch {
      throw new BadRequestException('Jeton de désinscription expiré ou invalide.');
    }
  }

  generateUnsubscribeToken(userId: string): string {
    const payload = `${userId}:${Date.now()}`;
    return Buffer.from(payload).toString('base64');
  }
}
