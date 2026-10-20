import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Difficulty } from '@prisma/client';
import { QuizzesService } from './quizzes.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProgressService } from '../common/progress/progress.service.js';

describe('QuizzesService', () => {
  let service: QuizzesService;
  let prisma: PrismaService;
  let progressService: ProgressService;

  const mockPrisma = {
    quiz: { findFirst: vi.fn() },
  };

  const mockProgressService = {
    recordActivity: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProgressService, useValue: mockProgressService },
      ],
    }).compile();

    service = module.get<QuizzesService>(QuizzesService);
    prisma = module.get<PrismaService>(PrismaService);
    progressService = module.get<ProgressService>(ProgressService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('devrait retourner le quiz avec réponses sans exposer isCorrect', async () => {
      mockPrisma.quiz.findFirst.mockResolvedValue({
        id: 'quiz-1',
        title: 'Quiz NestJS',
        description: 'Test',
        difficulty: Difficulty.NOVICE,
        categoryId: 'cat-1',
        lessonId: 'l-1',
        questions: [
          {
            id: 'q-1',
            title: 'Q1',
            codeSnippet: null,
            orderIndex: 1,
            answers: [
              { id: 'ans-1', text: 'Rep A', orderIndex: 1 },
              { id: 'ans-2', text: 'Rep B', orderIndex: 2 },
            ],
          },
        ],
        progress: [{ score: 100 }],
      });

      const result = await service.findOne('quiz-1', 'user-1');
      expect(result.id).toBe('quiz-1');
      expect(result.questionsCount).toBe(1);
      expect(result.userBestScore).toBe(100);
      expect((result.questions[0].answers[0] as any).isCorrect).toBeUndefined();
    });

    it('devrait lever NotFoundException si le quiz n’existe pas', async () => {
      mockPrisma.quiz.findFirst.mockResolvedValue(null);

      await expect(service.findOne('inconnu', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('submitQuiz', () => {
    it('devrait évaluer les réponses, calculer le score et retourner les explications', async () => {
      mockPrisma.quiz.findFirst.mockResolvedValue({
        id: 'quiz-1',
        categoryId: 'cat-1',
        difficulty: Difficulty.NOVICE,
        questions: [
          {
            id: 'q-1',
            explanation: 'Explication Q1',
            answers: [
              { id: 'ans-1', text: 'Rep A', isCorrect: true },
              { id: 'ans-2', text: 'Rep B', isCorrect: false },
            ],
          },
          {
            id: 'q-2',
            explanation: 'Explication Q2',
            answers: [
              { id: 'ans-3', text: 'Rep C', isCorrect: true },
              { id: 'ans-4', text: 'Rep D', isCorrect: false },
            ],
          },
        ],
      });

      mockProgressService.recordActivity.mockResolvedValue({
        isNewCompletion: true,
        xpEarned: 10,
        currentStreak: 1,
        longestStreak: 1,
      });

      const submission = {
        answers: [
          { questionId: 'q-1', selectedAnswerId: 'ans-1' }, // Vrai
          { questionId: 'q-2', selectedAnswerId: 'ans-4' }, // Faux
        ],
      };

      const result = await service.submitQuiz('quiz-1', 'user-1', submission);

      expect(result.totalQuestions).toBe(2);
      expect(result.correctCount).toBe(1);
      expect(result.score).toBe(50);
      expect(result.passed).toBe(false); // < 70%
      expect(result.corrections[0].isCorrect).toBe(true);
      expect(result.corrections[0].explanation).toBe('Explication Q1');
      expect(result.corrections[1].isCorrect).toBe(false);
      expect(result.corrections[1].correctAnswerId).toBe('ans-3');
    });

    it('devrait valider et attribuer la récompense si le score est >= 70%', async () => {
      mockPrisma.quiz.findFirst.mockResolvedValue({
        id: 'quiz-1',
        categoryId: 'cat-1',
        difficulty: Difficulty.NOVICE,
        questions: [
          {
            id: 'q-1',
            explanation: 'Explication Q1',
            answers: [{ id: 'ans-1', isCorrect: true }],
          },
        ],
      });

      mockProgressService.recordActivity.mockResolvedValue({
        isNewCompletion: true,
        xpEarned: 10,
        currentStreak: 2,
        longestStreak: 5,
      });

      const result = await service.submitQuiz('quiz-1', 'user-1', {
        answers: [{ questionId: 'q-1', selectedAnswerId: 'ans-1' }],
      });

      expect(result.score).toBe(100);
      expect(result.passed).toBe(true);
      expect(result.reward.xpEarned).toBe(10);
    });
  });
});
