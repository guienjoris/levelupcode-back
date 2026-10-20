import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service.js';

describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;

  const mockConfigService = {
    get: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  describe('avec clé Resend configurée', () => {
    let sendMock: any;

    beforeEach(async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'RESEND_API_KEY') return 're_test_123456789';
        if (key === 'MAIL_FROM') return 'LevelUpCode <onboarding@resend.dev>';
        if (key === 'ADMIN_EMAIL') return 'admin@levelupcode.dev';
        return null;
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<MailService>(MailService);
      configService = module.get<ConfigService>(ConfigService);

      sendMock = vi.fn();
      // On mock le client resend privé
      (service as any).resend = {
        emails: {
          send: sendMock,
        },
      };
    });

    it('devrait être défini', () => {
      expect(service).toBeDefined();
    });

    it('devrait envoyer un email avec succès via Resend', async () => {
      sendMock.mockResolvedValue({
        data: { id: 'email-id-123' },
        error: null,
      });

      const result = await service.sendEmail({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
      });

      expect(result).toBe(true);
      expect(sendMock).toHaveBeenCalledWith({
        from: 'LevelUpCode <onboarding@resend.dev>',
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
        text: undefined,
      });
    });

    it('devrait gérer les erreurs retournées par l’API Resend', async () => {
      sendMock.mockResolvedValue({
        data: null,
        error: { message: 'Domain not verified', name: 'validation_error' },
      });

      const result = await service.sendEmail({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
    });

    it('devrait gérer les exceptions réseau jetées par Resend', async () => {
      sendMock.mockRejectedValue(new Error('Network failure'));

      const result = await service.sendEmail({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
    });

    it('devrait formater et envoyer le rappel de streak pour une série active (> 0)', async () => {
      sendMock.mockResolvedValue({ data: { id: 'reminder-1' }, error: null });

      const result = await service.sendStreakReminder({
        to: 'learner@example.com',
        name: 'Alice',
        currentStreak: 5,
        unsubscribeUrl: 'https://levelupcode.dev/unsub?token=123',
      });

      expect(result).toBe(true);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'learner@example.com',
          subject: expect.stringContaining('5 jour(s)'),
          html: expect.stringContaining('Alice'),
        }),
      );
    });

    it('devrait formater et envoyer le rappel pour relancer une série (streak = 0)', async () => {
      sendMock.mockResolvedValue({ data: { id: 'reminder-2' }, error: null });

      const result = await service.sendStreakReminder({
        to: 'bob@example.com',
        name: null,
        currentStreak: 0,
      });

      expect(result).toBe(true);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'bob@example.com',
          subject: expect.stringContaining('Prêt pour 5 minutes de code'),
          html: expect.stringContaining('Développeur'),
        }),
      );
    });

    it('devrait formater et envoyer une alerte de signalement d’erreur à l’admin', async () => {
      sendMock.mockResolvedValue({ data: { id: 'alert-1' }, error: null });

      const result = await service.sendAdminErrorReport({
        type: 'LESSON',
        targetId: 'lesson-12345678',
        comment: 'La commande npm est erronée',
        userEmail: 'reporter@example.com',
      });

      expect(result).toBe(true);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@levelupcode.dev',
          subject: expect.stringContaining('LESSON #lesson-1'),
          html: expect.stringContaining('La commande npm est erronée'),
        }),
      );
    });
  });

  describe('sans clé Resend (simulation en développement)', () => {
    beforeEach(async () => {
      mockConfigService.get.mockReturnValue(null);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<MailService>(MailService);
    });

    it('devrait simuler l’envoi sans planter quand aucune clé n’est fournie', async () => {
      const result = await service.sendEmail({
        to: 'dev@example.com',
        subject: 'Test simulation',
        html: '<p>Simulé</p>',
      });

      expect(result).toBe(true);
    });
  });
});
