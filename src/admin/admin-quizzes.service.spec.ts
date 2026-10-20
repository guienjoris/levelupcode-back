import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Difficulty } from '@prisma/client';
import { AdminQuizzesService } from './admin-quizzes.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AdminQuizzesService', () => {
  let service: AdminQuizzesService;
  let prisma: PrismaService;

  const mockPrisma = {
    quiz: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
    lesson: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminQuizzesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminQuizzesService>(AdminQuizzesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('devrait créer un quiz avec ses questions de manière atomique', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
      mockPrisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });

      mockPrisma.$transaction.mockImplementation(async (cb) => {
        return cb({
          quiz: {
            create: vi.fn().mockResolvedValue({
              id: 'quiz-1',
              title: 'Quiz NestJS',
              questions: [],
            }),
          },
        });
      });

      const dto = {
        title: 'Quiz NestJS',
        difficulty: Difficulty.NOVICE,
        categoryId: 'cat-1',
        lessonId: 'lesson-1',
        questions: [
          {
            title: 'Q1',
            answers: [
              { text: 'A', isCorrect: true },
              { text: 'B', isCorrect: false },
            ],
          },
        ],
      };

      const result = await service.create(dto);
      expect(result.id).toBe('quiz-1');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('devrait lever BadRequestException si une question n’a pas de réponse exacte', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });

      const dto = {
        title: 'Quiz Invalide',
        difficulty: Difficulty.NOVICE,
        categoryId: 'cat-1',
        questions: [
          {
            title: 'Q1 sans bonne réponse',
            answers: [
              { text: 'A', isCorrect: false },
              { text: 'B', isCorrect: false },
            ],
          },
        ],
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('devrait lever NotFoundException si la catégorie est introuvable', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const dto = {
        title: 'Quiz',
        difficulty: Difficulty.NOVICE,
        categoryId: 'inconnu',
        questions: [{ title: 'Q', answers: [{ text: 'A', isCorrect: true }] }],
      };

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('devrait supprimer le quiz en cascade', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({ id: 'quiz-1', title: 'Q' });
      mockPrisma.quiz.delete.mockResolvedValue({});

      const res = await service.remove('quiz-1');
      expect(res.success).toBe(true);
      expect(mockPrisma.quiz.delete).toHaveBeenCalledWith({ where: { id: 'quiz-1' } });
    });
  });
});
