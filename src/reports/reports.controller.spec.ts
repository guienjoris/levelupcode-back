import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { ReportType } from '@prisma/client';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  const mockReportsService = {
    create: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: ReportsService, useValue: mockReportsService },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  it('devrait appeler reportsService.create avec les données transmises', async () => {
    const dto = {
      type: ReportType.LESSON,
      targetId: 'lesson-123',
      comment: 'Anomalie détectée dans le cours',
    };
    const user = { id: 'u-1', email: 'test@example.com', role: 'USER' as const };

    mockReportsService.create.mockResolvedValue({
      success: true,
      message: 'Signalement enregistré',
      report: { id: 'rep-1', ...dto },
    });

    const result = await controller.create(dto, user);

    expect(result.success).toBe(true);
    expect(mockReportsService.create).toHaveBeenCalledWith(dto, user);
  });
});
