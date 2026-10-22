import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { CronSecretGuard } from './guards/cron-secret.guard.js';
import { ConfigService } from '@nestjs/config';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotificationsService = {
    sendDailyReminders: vi.fn(),
    updatePreferences: vi.fn(),
    unsubscribeByToken: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: ConfigService, useValue: { get: vi.fn() } },
        { provide: CronSecretGuard, useValue: { canActivate: () => true } },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  it('devrait appeler sendDailyReminders', async () => {
    mockNotificationsService.sendDailyReminders.mockResolvedValue({
      success: true,
      totalEligible: 10,
      sentCount: 8,
      skippedCount: 2,
    });

    const result = await controller.sendDailyReminders();
    expect(result.sentCount).toBe(8);
    expect(mockNotificationsService.sendDailyReminders).toHaveBeenCalled();
  });

  it('devrait mettre à jour les préférences de l’utilisateur connecté', async () => {
    mockNotificationsService.updatePreferences.mockResolvedValue({
      success: true,
      emailDailyReminder: true,
    });

    const result = await controller.updatePreferences('user-1', {
      emailDailyReminder: true,
    });
    expect(result.emailDailyReminder).toBe(true);
    expect(mockNotificationsService.updatePreferences).toHaveBeenCalledWith(
      'user-1',
      true,
    );
  });

  it('devrait désinscrire via le jeton de désinscription', async () => {
    mockNotificationsService.unsubscribeByToken.mockResolvedValue({
      success: true,
      message: 'Désinscrit',
    });

    const result = await controller.unsubscribe('sample-token');
    expect(result.success).toBe(true);
    expect(mockNotificationsService.unsubscribeByToken).toHaveBeenCalledWith(
      'sample-token',
    );
  });
});
