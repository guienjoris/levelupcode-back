import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;
  let mailService: MailService;
  let configService: ConfigService;

  const mockPrisma = {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };

  const mockMailService = {
    sendStreakReminder: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'API_PUBLIC_URL') return 'https://api.levelupcode.dev';
      return null;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    mailService = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('sendDailyReminders', () => {
    it('devrait envoyer des emails aux utilisateurs inactifs aujourd’hui et ignorer les actifs', async () => {
      const now = new Date();
      const activeTodayDate = new Date(now.getTime() + 1000); // Actif aujourd'hui
      const activeYesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Inactif aujourd'hui

      const mockUsers = [
        {
          id: 'u-active',
          email: 'active@example.com',
          name: 'Active User',
          streak: {
            currentStreak: 3,
            lastActiveDate: activeTodayDate,
          },
        },
        {
          id: 'u-inactive',
          email: 'inactive@example.com',
          name: 'Inactive User',
          streak: {
            currentStreak: 5,
            lastActiveDate: activeYesterdayDate,
          },
        },
        {
          id: 'u-no-streak',
          email: 'nostreak@example.com',
          name: 'New User',
          streak: null,
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockMailService.sendStreakReminder.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.sendDailyReminders();

      expect(result.success).toBe(true);
      expect(result.totalEligible).toBe(3);
      expect(result.skippedCount).toBe(1); // u-active
      expect(result.sentCount).toBe(2); // u-inactive and u-no-streak

      // Vérifier que sendStreakReminder a été appelé 2 fois
      expect(mockMailService.sendStreakReminder).toHaveBeenCalledTimes(2);
      expect(mockMailService.sendStreakReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'inactive@example.com',
          currentStreak: 5,
        }),
      );
      expect(mockMailService.sendStreakReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'nostreak@example.com',
          currentStreak: 0,
        }),
      );

      // Vérifier l'horodatage d'envoi mis à jour
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-inactive' },
          data: expect.objectContaining({
            lastReminderEmailSentAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('updatePreferences', () => {
    it('devrait mettre à jour le statut des préférences de rappel', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'u1@example.com',
      });
      mockPrisma.user.update.mockResolvedValue({ emailDailyReminder: false });

      const result = await service.updatePreferences('u-1', false);

      expect(result).toEqual({ success: true, emailDailyReminder: false });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: { emailDailyReminder: false },
        select: { emailDailyReminder: true },
      });
    });

    it('devrait lever une NotFoundException si l’utilisateur n’existe pas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePreferences('unknown-id', true),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unsubscribeByToken', () => {
    it('devrait désinscrire l’utilisateur avec un jeton valide', async () => {
      const token = Buffer.from('u-123:1700000000000').toString('base64');
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.unsubscribeByToken(token);

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-123' },
        data: { emailDailyReminder: false },
      });
    });

    it('devrait rejeter un jeton invalide ou corrompu', async () => {
      await expect(service.unsubscribeByToken('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
