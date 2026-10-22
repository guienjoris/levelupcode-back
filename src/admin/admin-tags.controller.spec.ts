import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminTagsController } from './admin-tags.controller.js';
import { AdminTagsService } from './admin-tags.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

describe('AdminTagsController', () => {
  let controller: AdminTagsController;

  const mockAdminTagsService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTagsController],
      providers: [
        { provide: AdminTagsService, useValue: mockAdminTagsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminTagsController>(AdminTagsController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  it('devrait appeler findAll avec le filtre categoryId si présent', async () => {
    mockAdminTagsService.findAll.mockResolvedValue([]);
    const res = await controller.findAll('cat-1');
    expect(res).toEqual([]);
    expect(mockAdminTagsService.findAll).toHaveBeenCalledWith({
      categoryId: 'cat-1',
    });
  });

  it('devrait appeler findOne', async () => {
    mockAdminTagsService.findOne.mockResolvedValue({ id: 'tag-1' });
    const res = await controller.findOne('tag-1');
    expect(res).toEqual({ id: 'tag-1' });
    expect(mockAdminTagsService.findOne).toHaveBeenCalledWith('tag-1');
  });

  it('devrait appeler create', async () => {
    const dto = { slug: 'devops', name: 'DevOps' };
    mockAdminTagsService.create.mockResolvedValue({ id: 'tag-1', ...dto });
    const res = await controller.create(dto);
    expect(res.id).toBe('tag-1');
    expect(mockAdminTagsService.create).toHaveBeenCalledWith(dto);
  });

  it('devrait appeler update', async () => {
    const dto = { name: 'DevOps & SRE' };
    mockAdminTagsService.update.mockResolvedValue({ id: 'tag-1', ...dto });
    const res = await controller.update('tag-1', dto);
    expect(res.name).toBe('DevOps & SRE');
    expect(mockAdminTagsService.update).toHaveBeenCalledWith('tag-1', dto);
  });

  it('devrait appeler remove', async () => {
    mockAdminTagsService.remove.mockResolvedValue({ success: true });
    const res = await controller.remove('tag-1');
    expect(res.success).toBe(true);
    expect(mockAdminTagsService.remove).toHaveBeenCalledWith('tag-1');
  });
});
