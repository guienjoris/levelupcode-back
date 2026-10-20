import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Difficulty } from '@prisma/client';
import { LessonsService } from './lessons.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProgressService } from '../common/progress/progress.service.js';

describe('LessonsService', () => {
  let service: LessonsService;
  let prisma: PrismaService;
  let progressService: ProgressService;

  const mockPrisma = {
    category: { findUnique: vi.fn() },
    lesson: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() },
  };

  const mockProgressService = {
    recordActivity: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProgressService, useValue: mockProgressService },
      ],
    }).compile();

    service = module.get<LessonsService>(LessonsService);
    prisma = module.get<PrismaService>(PrismaService);
    progressService = module.get<ProgressService>(ProgressService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('findByCategory', () => {
    it('devrait retourner les leçons de la catégorie avec indicateur de complétion', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
      mockPrisma.lesson.findMany.mockResolvedValue([
        {
          id: 'l-1',
          slug: 'intro',
          title: 'Intro',
          description: 'Desc',
          difficulty: Difficulty.NOVICE,
          orderIndex: 1,
          categoryId: 'cat-1',
          quizzes: [{ id: 'q-1' }],
          progress: [{ id: 'prog-1' }],
        },
      ]);

      const result = await service.findByCategory('nestjs', 'user-1');
      expect(result).toHaveLength(1);
      expect(result[0].isCompleted).toBe(true);
      expect(result[0].hasQuiz).toBe(true);
    });

    it('devrait lever NotFoundException si la catégorie n’existe pas', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.findByCategory('inconnu', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('devrait retourner le détail complet et le markdown de la leçon', async () => {
      mockPrisma.lesson.findFirst.mockResolvedValue({
        id: 'l-1',
        slug: 'intro',
        title: 'Intro',
        description: 'Desc',
        contentMarkdown: '# Intro',
        difficulty: Difficulty.NOVICE,
        orderIndex: 1,
        categoryId: 'cat-1',
        category: { name: 'NestJS' },
        quizzes: [{ id: 'q-1' }],
        progress: [],
      });

      const result = await service.findOne('intro', 'user-1');
      expect(result.contentMarkdown).toBe('# Intro');
      expect(result.categoryName).toBe('NestJS');
      expect(result.quizId).toBe('q-1');
      expect(result.isCompleted).toBe(false);
    });

    it('devrait lever NotFoundException si la leçon n’existe pas', async () => {
      mockPrisma.lesson.findFirst.mockResolvedValue(null);

      await expect(service.findOne('inconnu', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('completeLesson', () => {
    it('devrait valider la leçon et retourner la récompense', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({
        id: 'l-1',
        categoryId: 'cat-1',
        difficulty: Difficulty.NOVICE,
      });
      mockProgressService.recordActivity.mockResolvedValue({
        isNewCompletion: true,
        xpEarned: 10,
        currentStreak: 1,
        longestStreak: 1,
      });

      const res = await service.completeLesson('l-1', 'user-1');
      expect(res.xpEarned).toBe(10);
      expect(res.currentStreak).toBe(1);
      expect(mockProgressService.recordActivity).toHaveBeenCalledWith({
        userId: 'user-1',
        categoryId: 'cat-1',
        difficulty: Difficulty.NOVICE,
        lessonId: 'l-1',
      });
    });
  });
});
