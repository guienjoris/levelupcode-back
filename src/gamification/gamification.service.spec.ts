import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GamificationService } from './gamification.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('GamificationService', () => {
  let service: GamificationService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('getUserStats', () => {
    it('devrait calculer correctement les statistiques de l’apprenant', async () => {
      const createdAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 jours
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        createdAt,
        isSupporter: true,
        streak: {
          currentStreak: 4,
          longestStreak: 8,
          lastActiveDate: new Date(),
        },
        progress: [
          { lessonId: 'l-1', quizId: null },
          { lessonId: 'l-2', quizId: null },
          { lessonId: null, quizId: 'q-1' },
        ],
        scores: [
          {
            categoryId: 'cat-1',
            tagId: null,
            xp: 50,
            category: { id: 'cat-1', name: 'NestJS', slug: 'nestjs' },
            tag: null,
          },
          {
            categoryId: null,
            tagId: 'tag-1',
            xp: 50,
            category: null,
            tag: { id: 'tag-1', name: 'Back-End', slug: 'back-end' },
          },
        ],
      });

      const stats = await service.getUserStats('u-1');

      expect(stats.userId).toBe('u-1');
      expect(stats.currentStreak).toBe(4);
      expect(stats.longestStreak).toBe(8);
      expect(stats.totalXp).toBe(50);
      expect(stats.completedLessonsCount).toBe(2);
      expect(stats.completedQuizzesCount).toBe(1);
      expect(stats.daysSinceRegistration).toBe(10);
      expect(stats.isSupporter).toBe(true);
      expect(stats.xpByCategory).toHaveLength(1);
      expect(stats.xpByTag).toHaveLength(1);
    });

    it('devrait lever NotFoundException si l’utilisateur n’existe pas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserStats('inconnu')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLeaderboard', () => {
    it('devrait classer les utilisateurs par XP décroissant par défaut', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'u-1',
          name: 'Alice',
          avatarUrl: null,
          isSupporter: false,
          streak: { currentStreak: 3, longestStreak: 5 },
          scores: [{ xp: 100 }, { xp: 50 }], // total 150
        },
        {
          id: 'u-2',
          name: 'Bob',
          avatarUrl: null,
          isSupporter: true,
          streak: { currentStreak: 10, longestStreak: 15 },
          scores: [{ xp: 300 }], // total 300
        },
      ]);

      const result = await service.getLeaderboard({ limit: 10, offset: 0, sortBy: 'xp' });

      expect(result.total).toBe(2);
      expect(result.entries[0].userId).toBe('u-2'); // Bob premier (300 XP)
      expect(result.entries[0].rank).toBe(1);
      expect(result.entries[0].totalXp).toBe(300);
      expect(result.entries[1].userId).toBe('u-1'); // Alice seconde (150 XP)
      expect(result.entries[1].rank).toBe(2);
    });

    it('devrait classer par streak si demandé', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'u-1',
          name: 'Alice',
          email: 'alice@test.com',
          avatarUrl: null,
          isSupporter: false,
          streak: { currentStreak: 3, longestStreak: 20 },
          scores: [{ xp: 100 }],
        },
        {
          id: 'u-2',
          name: 'Bob',
          email: 'bob@test.com',
          avatarUrl: null,
          isSupporter: false,
          streak: { currentStreak: 5, longestStreak: 5 },
          scores: [{ xp: 500 }],
        },
      ]);

      const result = await service.getLeaderboard({ limit: 10, offset: 0, sortBy: 'streak' });

      expect(result.entries[0].userId).toBe('u-1'); // Alice première par longestStreak (20)
      expect(result.entries[0].longestStreak).toBe(20);
    });
  });
});
