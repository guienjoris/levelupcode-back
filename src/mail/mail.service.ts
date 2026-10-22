import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendStreakReminderParams {
  to: string;
  name?: string | null;
  currentStreak: number;
  unsubscribeUrl?: string;
}

export interface SendAdminErrorReportParams {
  type: 'LESSON' | 'QUIZ';
  targetId: string;
  comment: string;
  userEmail?: string | null;
  date?: Date;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null = null;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail =
      this.configService.get<string>('MAIL_FROM') ||
      'LevelUpCode <onboarding@resend.dev>';

    if (apiKey && apiKey.startsWith('re_')) {
      this.resend = new Resend(apiKey);
      this.logger.log('Client Resend initialisé avec succès');
    } else {
      this.logger.warn(
        'Aucune clé RESEND_API_KEY valide configurée. Les emails seront simulés en console.',
      );
    }
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<boolean> {
    const { to, subject, html, text } = options;

    if (!this.resend) {
      this.logger.log(`[SIMULATION EMAIL] À : ${to} | Sujet : ${subject}`);
      return true;
    }

    try {
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
        text,
      });

      if (response.error) {
        this.logger.error(
          `Erreur retournée par Resend lors de l'envoi à ${to} :`,
          response.error,
        );
        return false;
      }

      this.logger.log(
        `Email envoyé avec succès à ${to} (ID: ${response.data?.id})`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Échec de l'envoi de l'email à ${to} :`, error);
      return false;
    }
  }

  async sendStreakReminder(params: SendStreakReminderParams): Promise<boolean> {
    const { to, name, currentStreak, unsubscribeUrl } = params;

    const displayName = name ? name : 'Développeur';
    const isStreakPositive = currentStreak > 0;

    const subject = isStreakPositive
      ? `🔥 Ne perds pas ta série de ${currentStreak} jour(s) sur LevelUpCode !`
      : `🚀 Prêt pour 5 minutes de code aujourd'hui sur LevelUpCode ?`;

    const ctaUrl = 'https://levelupcode.dev/categories';
    const optOutLink =
      unsubscribeUrl || `https://levelupcode.dev/profile/preferences`;

    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
        .content { padding: 32px 24px; line-height: 1.6; }
        .content p { font-size: 16px; color: #cbd5e1; margin-bottom: 20px; }
        .streak-badge { background-color: #334155; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; border: 1px solid #475569; }
        .streak-count { font-size: 36px; font-weight: 800; color: #f59e0b; margin: 4px 0; }
        .streak-label { font-size: 14px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; font-weight: 600; }
        .cta-container { text-align: center; margin: 32px 0 16px 0; }
        .btn { display: inline-block; background-color: #6366f1; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); }
        .footer { padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
        .footer a { color: #94a3b8; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚡ LevelUpCode</h1>
        </div>
        <div class="content">
          <p>Bonjour <strong>${displayName}</strong>,</p>
          ${
            isStreakPositive
              ? `<p>La journée touche bientôt à sa fin et tu n’as pas encore réalisé ton exercice quotidien pour maintenir ta série active !</p>
                 <div class="streak-badge">
                   <div class="streak-label">Ta Série Actuelle</div>
                   <div class="streak-count">🔥 ${currentStreak} JOUR${currentStreak > 1 ? 'S' : ''}</div>
                 </div>
                 <p>Ne laisse pas tes efforts s’éteindre : 5 petites minutes suffisent pour valider une leçon ou réussir un quiz et propulser ton score.</p>`
              : `<p>Tu n’as pas encore codé aujourd’hui sur <strong>LevelUpCode</strong>. Prends 5 petites minutes ce soir pour démarrer ou relancer une série de feu !</p>
                 <div class="streak-badge">
                   <div class="streak-label">Nouveau Défi</div>
                   <div class="streak-count">🚀 Jour 1</div>
                 </div>
                 <p>Choisis une leçon parmi nos 9 catégories (TypeScript, NestJS, React, Architecture...) et passe au niveau supérieur !</p>`
          }
          <div class="cta-container">
            <a href="${ctaUrl}" class="btn">Faire mon exercice du jour →</a>
          </div>
        </div>
        <div class="footer">
          Tu reçois cet email car les rappels quotidiens de streak sont activés sur ton compte LevelUpCode.<br>
          <a href="${optOutLink}">Se désinscrire des rappels quotidiens</a>
        </div>
      </div>
    </body>
    </html>
    `;

    return this.sendEmail({ to, subject, html });
  }

  async sendAdminErrorReport(
    params: SendAdminErrorReportParams,
  ): Promise<boolean> {
    const { type, targetId, comment, userEmail, date } = params;
    const adminEmail =
      this.configService.get<string>('ADMIN_EMAIL') || 'admin@levelupcode.dev';

    const formattedDate = (date || new Date()).toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const subject = `⚠️ [LevelUpCode] Signalement d'erreur : ${type} #${targetId.slice(0, 8)}`;

    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #2d3748; }
        .card { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .header { background-color: #fed7d7; border-bottom: 2px solid #feb2b2; padding: 16px 20px; }
        .header h2 { margin: 0; color: #9b2c2c; font-size: 18px; }
        .content { padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        td { padding: 8px 12px; border-bottom: 1px solid #edf2f7; font-size: 14px; }
        td.label { font-weight: bold; width: 35%; background-color: #f7fafc; color: #4a5568; }
        .comment-box { background-color: #fffaf0; border-left: 4px solid #dd6b20; padding: 16px; border-radius: 4px; margin: 20px 0; }
        .comment-box h4 { margin: 0 0 8px 0; color: #9c4221; font-size: 14px; }
        .comment-text { white-space: pre-wrap; font-size: 14px; color: #2d3748; line-height: 1.5; margin: 0; }
        .footer { font-size: 12px; color: #a0aec0; text-align: center; padding: 12px; background-color: #f7fafc; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2>⚠️ Nouveau Signalement d'Erreur Reçu</h2>
        </div>
        <div class="content">
          <p>Un utilisateur a signalé une anomalie sur la plateforme LevelUpCode :</p>
          <table>
            <tr>
              <td class="label">Type de contenu :</td>
              <td><strong>${type}</strong></td>
            </tr>
            <tr>
              <td class="label">Identifiant (ID) :</td>
              <td><code>${targetId}</code></td>
            </tr>
            <tr>
              <td class="label">Date :</td>
              <td>${formattedDate}</td>
            </tr>
            <tr>
              <td class="label">Auteur du signalement :</td>
              <td>${userEmail || 'Utilisateur anonyme'}</td>
            </tr>
          </table>

          <div class="comment-box">
            <h4>💬 Commentaire et description de l'erreur :</h4>
            <p class="comment-text">${comment}</p>
          </div>

          <p style="font-size: 13px; color: #718096;">
            Pour corriger ce contenu, utilisez directement les routes d'administration :<br>
            <code>PATCH /admin/${type.toLowerCase()}s/${targetId}</code>
          </p>
        </div>
        <div class="footer">
          Notification automatique générée par LevelUpCode API
        </div>
      </div>
    </body>
    </html>
    `;

    return this.sendEmail({ to: adminEmail, subject, html });
  }
}
