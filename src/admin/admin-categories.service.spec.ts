import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminCategoriesService } from './admin-categories.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AdminCategoriesService', () => {
  let service: AdminCategoriesService;

  const mockPrisma = {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    tag: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    tagOnCategory: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminCategoriesService>(AdminCategoriesService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('devrait retourner toutes les catégories ordonnées', async () => {
      mockPrisma.category.findMany.mockResolvedValue([
        { id: 'cat-1', name: 'JavaScript', orderIndex: 1 },
      ]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        orderBy: { orderIndex: 'asc' },
        include: {
          tags: { include: { tag: true } },
          _count: { select: { lessons: true, quizzes: true } },
        },
      });
    });
  });

  describe('findOne', () => {
    it('devrait retourner la catégorie par identifiant', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: 'JavaScript',
      });

      const result = await service.findOne('cat-1');
      expect(result.id).toBe('cat-1');
    });

    it('devrait lever NotFoundException si la catégorie n’existe pas', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.findOne('inconnu')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('devrait créer une catégorie avec succès', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.tag.findMany.mockResolvedValue([{ id: 'tag-1' }]);
      mockPrisma.category.create.mockResolvedValue({
        id: 'cat-1',
        slug: 'docker',
        name: 'Docker',
      });

      const dto = {
        slug: 'docker',
        name: 'Docker',
        tagIds: ['tag-1'],
      };

      const result = await service.create(dto);
      expect(result.id).toBe('cat-1');
      expect(mockPrisma.category.create).toHaveBeenCalled();
    });

    it('devrait lever ConflictException si le slug est déjà utilisé', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'existant' });

      await expect(
        service.create({
          slug: 'deja-pris',
          name: 'Catégorie',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('devrait lever NotFoundException si un tag spécifié est introuvable', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.tag.findMany.mockResolvedValue([]);

      await expect(
        service.create({
          slug: 'docker',
          name: 'Docker',
          tagIds: ['tag-inconnu'],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('devrait mettre à jour une catégorie', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        slug: 'ancien-slug',
        name: 'Ancien Nom',
      });

      mockPrisma.$transaction.mockImplementation(async (cb) => {
        return cb({
          tagOnCategory: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
          category: {
            update: vi.fn().mockResolvedValue({
              id: 'cat-1',
              name: 'Nouveau Nom',
            }),
          },
        });
      });

      const result = await service.update('cat-1', { name: 'Nouveau Nom' });
      expect(result.name).toBe('Nouveau Nom');
    });

    it('devrait lever NotFoundException si la catégorie est introuvable', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.update('inconnu', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devrait lever ConflictException si le nouveau slug est déjà pris', async () => {
      mockPrisma.category.findUnique
        .mockResolvedValueOnce({ id: 'cat-1', slug: 'ancien-slug' })
        .mockResolvedValueOnce({ id: 'cat-2', slug: 'nouveau-slug' });

      await expect(
        service.update('cat-1', { slug: 'nouveau-slug' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('devrait supprimer une catégorie existante', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: 'Catégorie à supprimer',
      });
      mockPrisma.category.delete.mockResolvedValue({});

      const res = await service.remove('cat-1');
      expect(res.success).toBe(true);
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
    });

    it('devrait lever NotFoundException si la catégorie n’existe pas', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.remove('inconnu')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('attachTag & detachTag', () => {
    it('devrait associer un tag existant à une catégorie', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: 'Cat',
      });
      mockPrisma.tag.findUnique.mockResolvedValue({ id: 'tag-1', name: 'Tag' });
      mockPrisma.tagOnCategory.upsert.mockResolvedValue({});

      const res = await service.attachTag('cat-1', 'tag-1');
      expect(res.success).toBe(true);
      expect(mockPrisma.tagOnCategory.upsert).toHaveBeenCalled();
    });

    it('devrait dissocier un tag d’une catégorie', async () => {
      mockPrisma.tagOnCategory.findUnique.mockResolvedValue({
        categoryId: 'cat-1',
        tagId: 'tag-1',
      });
      mockPrisma.tagOnCategory.delete.mockResolvedValue({});

      const res = await service.detachTag('cat-1', 'tag-1');
      expect(res.success).toBe(true);
      expect(mockPrisma.tagOnCategory.delete).toHaveBeenCalled();
    });

    it('devrait lever NotFoundException si la liaison tag-catégorie n’existe pas', async () => {
      mockPrisma.tagOnCategory.findUnique.mockResolvedValue(null);

      await expect(service.detachTag('cat-1', 'tag-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
