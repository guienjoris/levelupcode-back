import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { DonationsController } from './donations.controller.js';
import { DonationsService } from './donations.service.js';
import { BmcWebhookGuard } from './guards/bmc-webhook.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

describe('DonationsController', () => {
  let controller: DonationsController;
  let service: DonationsService;

  const mockDonationsService = {
    handleBmcWebhook: vi.fn(),
    getMyDonations: vi.fn(),
    getRecentSupporters: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DonationsController],
      providers: [
        { provide: DonationsService, useValue: mockDonationsService },
      ],
    })
      .overrideGuard(BmcWebhookGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DonationsController>(DonationsController);
    service = module.get<DonationsService>(DonationsService);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  it('devrait transmettre le payload webhook au service', async () => {
    const payload = { transaction_id: 'tx_123', amount: 5 };
    mockDonationsService.handleBmcWebhook.mockResolvedValue({ success: true });

    const result = await controller.handleBmcWebhook(payload);
    expect(result.success).toBe(true);
    expect(mockDonationsService.handleBmcWebhook).toHaveBeenCalledWith(payload);
  });

  it('devrait retourner les dons de l’utilisateur connecté', async () => {
    mockDonationsService.getMyDonations.mockResolvedValue({
      isSupporter: true,
      donations: [],
    });

    const result = await controller.getMyDonations('user-1');
    expect(result.isSupporter).toBe(true);
    expect(mockDonationsService.getMyDonations).toHaveBeenCalledWith('user-1');
  });

  it('devrait retourner les donateurs récents pour le mur public', async () => {
    mockDonationsService.getRecentSupporters.mockResolvedValue([]);

    const result = await controller.getRecentSupporters(15);
    expect(result).toEqual([]);
    expect(mockDonationsService.getRecentSupporters).toHaveBeenCalledWith(15);
  });
});
