import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminReportsController } from './admin-reports.controller.js';
import { ReportsService } from './reports.service.js';
import { ReportStatus, ReportType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

describe('AdminReportsController', () => {
  let controller: AdminReportsController;
  let service: ReportsService;

  const mockReportsService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminReportsController],
      providers: [{ provide: ReportsService, useValue: mockReportsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminReportsController>(AdminReportsController);
    service = module.get<ReportsService>(ReportsService);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  it('devrait appeler findAll avec les critères de recherche', async () => {
    const query = { status: ReportStatus.PENDING, page: 1, limit: 10 };
    mockReportsService.findAll.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    });

    const result = await controller.findAll(query);
    expect(result.meta.total).toBe(0);
    expect(mockReportsService.findAll).toHaveBeenCalledWith(query);
  });

  it('devrait appeler findOne avec l’UUID', async () => {
    mockReportsService.findOne.mockResolvedValue({ id: 'rep-1' });

    const result = await controller.findOne(
      '550e8400-e29b-41d4-a716-446655440000',
    );
    expect(result.id).toBe('rep-1');
    expect(mockReportsService.findOne).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('devrait appeler updateStatus avec le nouveau statut', async () => {
    mockReportsService.updateStatus.mockResolvedValue({
      id: 'rep-1',
      status: ReportStatus.RESOLVED,
    });

    const result = await controller.updateStatus(
      '550e8400-e29b-41d4-a716-446655440000',
      { status: ReportStatus.RESOLVED },
    );
    expect(result.status).toBe(ReportStatus.RESOLVED);
    expect(mockReportsService.updateStatus).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
      ReportStatus.RESOLVED,
    );
  });

  it('devrait appeler delete avec l’UUID', async () => {
    mockReportsService.delete.mockResolvedValue({ success: true });

    const result = await controller.delete(
      '550e8400-e29b-41d4-a716-446655440000',
    );
    expect(result.success).toBe(true);
    expect(mockReportsService.delete).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });
});
