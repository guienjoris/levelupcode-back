import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Difficulty } from '@prisma/client';
import { AdminLessonsService } from './admin-lessons.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AdminLessonsService', () => {
  let service: AdminLessonsService;
  let prisma: PrismaService;

  const mockPrisma = {
    lesson: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminLessonsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminLessonsService>(AdminLessonsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('devrait créer une nouvelle leçon avec succès', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
      mockPrisma.lesson.create.mockResolvedValue({
        id: 'lesson-1',
        slug: 'nouvelle-lecon',
        title: 'Nouvelle Leçon',
        categoryId: 'cat-1',
        difficulty: Difficulty.NOVICE,
      });

      const dto = {
        slug: 'nouvelle-lecon',
        title: 'Nouvelle Leçon',
        contentMarkdown: '# Contenu',
        difficulty: Difficulty.NOVICE,
        categoryId: 'cat-1',
      };

      const result = await service.create(dto);
      expect(result.id).toBe('lesson-1');
      expect(mockPrisma.lesson.create).toHaveBeenCalled();
    });

    it('devrait lever ConflictException si le slug est déjà utilisé', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({ id: 'existante' });

      await expect(
        service.create({
          slug: 'deja-pris',
          title: 'Titre',
          contentMarkdown: '# MD',
          difficulty: Difficulty.NOVICE,
          categoryId: 'cat-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('devrait lever NotFoundException si la catégorie est introuvable', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          slug: 'slug-valide',
          title: 'Titre',
          contentMarkdown: '# MD',
          difficulty: Difficulty.NOVICE,
          categoryId: 'inconnu',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('devrait mettre à jour une leçon existante', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({
        id: 'l-1',
        slug: 'ancien-slug',
        title: 'Ancien Titre',
      });
      mockPrisma.lesson.update.mockResolvedValue({
        id: 'l-1',
        title: 'Nouveau Titre',
      });

      const result = await service.update('l-1', { title: 'Nouveau Titre' });
      expect(result.title).toBe('Nouveau Titre');
    });

    it('devrait lever NotFoundException si la leçon n’existe pas', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.update('inconnu', { title: 'T' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('devrait supprimer une leçon existante', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({
        id: 'l-1',
        title: 'Leçon à supprimer',
      });
      mockPrisma.lesson.delete.mockResolvedValue({});

      const res = await service.remove('l-1');
      expect(res.success).toBe(true);
      expect(mockPrisma.lesson.delete).toHaveBeenCalledWith({ where: { id: 'l-1' } });
    });
  });
});
