import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminCategoriesController } from './admin-categories.controller.js';
import { AdminCategoriesService } from './admin-categories.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

describe('AdminCategoriesController', () => {
  let controller: AdminCategoriesController;

  const mockAdminCategoriesService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    attachTag: vi.fn(),
    detachTag: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCategoriesController],
      providers: [
        {
          provide: AdminCategoriesService,
          useValue: mockAdminCategoriesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminCategoriesController>(
      AdminCategoriesController,
    );
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  it('devrait appeler findAll', async () => {
    mockAdminCategoriesService.findAll.mockResolvedValue([]);
    const res = await controller.findAll();
    expect(res).toEqual([]);
    expect(mockAdminCategoriesService.findAll).toHaveBeenCalled();
  });

  it('devrait appeler findOne', async () => {
    mockAdminCategoriesService.findOne.mockResolvedValue({ id: 'cat-1' });
    const res = await controller.findOne('cat-1');
    expect(res).toEqual({ id: 'cat-1' });
    expect(mockAdminCategoriesService.findOne).toHaveBeenCalledWith('cat-1');
  });

  it('devrait appeler create', async () => {
    const dto = { slug: 'docker', name: 'Docker' };
    mockAdminCategoriesService.create.mockResolvedValue({
      id: 'cat-1',
      ...dto,
    });
    const res = await controller.create(dto);
    expect(res.id).toBe('cat-1');
    expect(mockAdminCategoriesService.create).toHaveBeenCalledWith(dto);
  });

  it('devrait appeler update', async () => {
    const dto = { name: 'Docker Update' };
    mockAdminCategoriesService.update.mockResolvedValue({
      id: 'cat-1',
      ...dto,
    });
    const res = await controller.update('cat-1', dto);
    expect(res.name).toBe('Docker Update');
    expect(mockAdminCategoriesService.update).toHaveBeenCalledWith(
      'cat-1',
      dto,
    );
  });

  it('devrait appeler remove', async () => {
    mockAdminCategoriesService.remove.mockResolvedValue({ success: true });
    const res = await controller.remove('cat-1');
    expect(res.success).toBe(true);
    expect(mockAdminCategoriesService.remove).toHaveBeenCalledWith('cat-1');
  });

  it('devrait appeler attachTag', async () => {
    mockAdminCategoriesService.attachTag.mockResolvedValue({ success: true });
    const res = await controller.attachTag('cat-1', 'tag-1');
    expect(res.success).toBe(true);
    expect(mockAdminCategoriesService.attachTag).toHaveBeenCalledWith(
      'cat-1',
      'tag-1',
    );
  });

  it('devrait appeler detachTag', async () => {
    mockAdminCategoriesService.detachTag.mockResolvedValue({ success: true });
    const res = await controller.detachTag('cat-1', 'tag-1');
    expect(res.success).toBe(true);
    expect(mockAdminCategoriesService.detachTag).toHaveBeenCalledWith(
      'cat-1',
      'tag-1',
    );
  });
});
