import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminDonationsController } from './admin-donations.controller.js';
import { DonationsService } from './donations.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

describe('AdminDonationsController', () => {
  let controller: AdminDonationsController;
  let service: DonationsService;

  const mockDonationsService = {
    findAll: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDonationsController],
      providers: [
        { provide: DonationsService, useValue: mockDonationsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminDonationsController>(AdminDonationsController);
    service = module.get<DonationsService>(DonationsService);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  it('devrait appeler donationsService.findAll avec les filtres fournis', async () => {
    const query = { email: 'test@example.com', page: 1, limit: 10 };
    mockDonationsService.findAll.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      stats: { totalAmount: 0, totalDonations: 0 },
    });

    const result = await controller.findAll(query);
    expect(result.data).toEqual([]);
    expect(mockDonationsService.findAll).toHaveBeenCalledWith(query);
  });
});
