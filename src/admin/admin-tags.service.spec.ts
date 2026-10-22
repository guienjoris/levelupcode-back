import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminTagsService } from './admin-tags.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AdminTagsService', () => {
  let service: AdminTagsService;

  const mockPrisma = {
    tag: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    tagOnCategory: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminTagsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminTagsService>(AdminTagsService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('devrait retourner tous les tags ordonnés', async () => {
      mockPrisma.tag.findMany.mockResolvedValue([
        { id: 'tag-1', name: 'DevOps', slug: 'devops' },
      ]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: 'asc' },
        include: {
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          _count: { select: { categories: true, scores: true } },
        },
      });
    });

    it('devrait filtrer par categoryId si fourni', async () => {
      mockPrisma.tag.findMany.mockResolvedValue([]);

      await service.findAll({ categoryId: 'cat-1' });
      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            categories: {
              some: { categoryId: 'cat-1' },
            },
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('devrait retourner le tag par identifiant', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue({
        id: 'tag-1',
        name: 'DevOps',
      });

      const result = await service.findOne('tag-1');
      expect(result.id).toBe('tag-1');
    });

    it('devrait lever NotFoundException si le tag n’existe pas', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(null);

      await expect(service.findOne('inconnu')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('devrait créer un tag avec succès', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(null);
      mockPrisma.category.findMany.mockResolvedValue([{ id: 'cat-1' }]);
      mockPrisma.tag.create.mockResolvedValue({
        id: 'tag-1',
        slug: 'devops',
        name: 'DevOps',
      });

      const dto = {
        slug: 'devops',
        name: 'DevOps',
        categoryIds: ['cat-1'],
      };

      const result = await service.create(dto);
      expect(result.id).toBe('tag-1');
      expect(mockPrisma.tag.create).toHaveBeenCalled();
    });

    it('devrait lever ConflictException si le slug est déjà utilisé', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue({ id: 'existant' });

      await expect(
        service.create({
          slug: 'deja-pris',
          name: 'Tag',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('devrait lever NotFoundException si une catégorie spécifiée est introuvable', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(null);
      mockPrisma.category.findMany.mockResolvedValue([]);

      await expect(
        service.create({
          slug: 'devops',
          name: 'DevOps',
          categoryIds: ['cat-inconnu'],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('devrait mettre à jour un tag', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue({
        id: 'tag-1',
        slug: 'ancien-slug',
        name: 'Ancien Nom',
      });

      mockPrisma.$transaction.mockImplementation(async (cb) => {
        return cb({
          tagOnCategory: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
          tag: {
            update: vi.fn().mockResolvedValue({
              id: 'tag-1',
              name: 'Nouveau Nom',
            }),
          },
        });
      });

      const result = await service.update('tag-1', { name: 'Nouveau Nom' });
      expect(result.name).toBe('Nouveau Nom');
    });

    it('devrait lever NotFoundException si le tag est introuvable', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(null);

      await expect(service.update('inconnu', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devrait lever ConflictException si le nouveau slug est déjà pris', async () => {
      mockPrisma.tag.findUnique
        .mockResolvedValueOnce({ id: 'tag-1', slug: 'ancien-slug' })
        .mockResolvedValueOnce({ id: 'tag-2', slug: 'nouveau-slug' });

      await expect(
        service.update('tag-1', { slug: 'nouveau-slug' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('devrait supprimer un tag existant', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue({
        id: 'tag-1',
        name: 'Tag à supprimer',
      });
      mockPrisma.tag.delete.mockResolvedValue({});

      const res = await service.remove('tag-1');
      expect(res.success).toBe(true);
      expect(mockPrisma.tag.delete).toHaveBeenCalledWith({
        where: { id: 'tag-1' },
      });
    });

    it('devrait lever NotFoundException si le tag n’existe pas', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(null);

      await expect(service.remove('inconnu')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
