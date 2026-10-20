import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { Difficulty } from '@prisma/client';
import { ProgressService } from './progress.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('ProgressService', () => {
  let service: ProgressService;
  let prisma: PrismaService;

  const mockPrisma = {
    userProgress: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userScore: {
      upsert: vi.fn(),
    },
    userStreak: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    tagOnCategory: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  it('recordActivity devrait attribuer de l’XP pour une nouvelle complétion et mettre à jour le streak', async () => {
    mockPrisma.userProgress.findFirst.mockResolvedValue(null);
    mockPrisma.userProgress.create.mockResolvedValue({ id: 'prog-1' });
    mockPrisma.userScore.upsert.mockResolvedValue({});
    mockPrisma.userStreak.findUnique.mockResolvedValue({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 2,
      longestStreak: 5,
      lastActiveDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Hier
    });
    mockPrisma.userStreak.update.mockResolvedValue({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 3,
      longestStreak: 5,
      lastActiveDate: new Date(),
    });

    const reward = await service.recordActivity({
      userId: 'user-1',
      categoryId: 'cat-1',
      difficulty: Difficulty.INTERMEDIAIRE,
      lessonId: 'lesson-1',
    });

    expect(reward.isNewCompletion).toBe(true);
    expect(reward.xpEarned).toBe(20);
    expect(reward.currentStreak).toBe(3);
    expect(mockPrisma.userScore.upsert).toHaveBeenCalled();
  });

  it('recordActivity ne devrait pas réattribuer d’XP si déjà complété', async () => {
    mockPrisma.userProgress.findFirst.mockResolvedValue({ id: 'prog-1', score: 100 });
    mockPrisma.userStreak.findUnique.mockResolvedValue({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: new Date(), // Déjà actif aujourd'hui
    });
    mockPrisma.userStreak.update.mockResolvedValue({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: new Date(),
    });

    const reward = await service.recordActivity({
      userId: 'user-1',
      categoryId: 'cat-1',
      difficulty: Difficulty.NOVICE,
      lessonId: 'lesson-1',
    });

    expect(reward.isNewCompletion).toBe(false);
    expect(reward.xpEarned).toBe(0);
    expect(mockPrisma.userScore.upsert).not.toHaveBeenCalled();
  });
});
