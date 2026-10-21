import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReportStatus, ReportType } from '@prisma/client';
import { ReportsService } from './reports.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaService;
  let mailService: MailService;

  const mockPrisma = {
    lesson: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    quiz: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    contentReport: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  const mockMailService = {
    sendAdminErrorReport: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
    mailService = module.get<MailService>(MailService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('devrait créer un signalement de leçon et envoyer un email à l’admin', async () => {
      mockPrisma.lesson.findFirst.mockResolvedValue({
        id: 'lesson-uuid-1',
        title: 'Introduction aux Décorateurs',
      });

      const fakeCreatedReport = {
        id: 'report-1',
        type: ReportType.LESSON,
        targetId: 'lesson-uuid-1',
        comment: 'Erreur dans le snippet de code',
        status: ReportStatus.PENDING,
        userId: 'user-1',
        createdAt: new Date(),
        user: { id: 'user-1', email: 'dev@test.com', name: 'John Doe' },
      };

      mockPrisma.contentReport.create.mockResolvedValue(fakeCreatedReport);
      mockMailService.sendAdminErrorReport.mockResolvedValue(true);

      const result = await service.create(
        {
          type: ReportType.LESSON,
          targetId: 'intro-decorateurs',
          comment: 'Erreur dans le snippet de code',
        },
        { id: 'user-1', email: 'dev@test.com' },
      );

      expect(result.success).toBe(true);
      expect(result.report.targetTitle).toBe('Introduction aux Décorateurs');
      expect(mockPrisma.contentReport.create).toHaveBeenCalledWith({
        data: {
          type: ReportType.LESSON,
          targetId: 'lesson-uuid-1',
          comment: 'Erreur dans le snippet de code',
          userId: 'user-1',
        },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      });
      expect(mockMailService.sendAdminErrorReport).toHaveBeenCalledWith({
        type: ReportType.LESSON,
        targetId: 'lesson-uuid-1',
        comment: 'Erreur dans le snippet de code',
        userEmail: 'dev@test.com',
        date: fakeCreatedReport.createdAt,
      });
    });

    it('devrait créer un signalement de quiz avec succès', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-uuid-1',
        title: 'Quiz NestJS Pipes',
      });

      const fakeCreatedReport = {
        id: 'report-2',
        type: ReportType.QUIZ,
        targetId: 'quiz-uuid-1',
        comment: 'La réponse C est ambiguë',
        status: ReportStatus.PENDING,
        userId: null,
        createdAt: new Date(),
        user: null,
      };

      mockPrisma.contentReport.create.mockResolvedValue(fakeCreatedReport);
      mockMailService.sendAdminErrorReport.mockResolvedValue(true);

      const result = await service.create(
        {
          type: ReportType.QUIZ,
          targetId: 'quiz-uuid-1',
          comment: 'La réponse C est ambiguë',
        },
        null,
      );

      expect(result.success).toBe(true);
      expect(result.report.targetTitle).toBe('Quiz NestJS Pipes');
      expect(mockMailService.sendAdminErrorReport).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ReportType.QUIZ,
          targetId: 'quiz-uuid-1',
          userEmail: null,
        }),
      );
    });

    it('devrait lever NotFoundException si la leçon ciblée n’existe pas', async () => {
      mockPrisma.lesson.findFirst.mockResolvedValue(null);

      await expect(
        service.create({
          type: ReportType.LESSON,
          targetId: 'non-existing-slug',
          comment: 'Bug',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('devrait lever NotFoundException si le quiz ciblé n’existe pas', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          type: ReportType.QUIZ,
          targetId: 'unknown-quiz-id',
          comment: 'Bug',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('devrait retourner la liste paginée et enrichie des signalements', async () => {
      const reports = [
        {
          id: 'rep-1',
          type: ReportType.LESSON,
          targetId: 'lesson-1',
          comment: 'Fautes d’orthographe',
          status: ReportStatus.PENDING,
          user: { id: 'u-1', email: 'u1@test.com', name: 'User 1' },
        },
      ];

      mockPrisma.contentReport.findMany.mockResolvedValue(reports);
      mockPrisma.contentReport.count.mockResolvedValue(1);
      mockPrisma.lesson.findMany.mockResolvedValue([
        { id: 'lesson-1', title: 'Leçon 1', slug: 'lecon-1' },
      ]);
      mockPrisma.quiz.findMany.mockResolvedValue([]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data.length).toBe(1);
      expect(result.data[0].targetDetails).toEqual({
        id: 'lesson-1',
        title: 'Leçon 1',
        slug: 'lecon-1',
      });
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('findOne', () => {
    it('devrait retourner le signalement avec les détails de la cible', async () => {
      mockPrisma.contentReport.findUnique.mockResolvedValue({
        id: 'rep-1',
        type: ReportType.LESSON,
        targetId: 'lesson-1',
        comment: 'Code non compilable',
        status: ReportStatus.PENDING,
        user: null,
      });

      mockPrisma.lesson.findUnique.mockResolvedValue({
        id: 'lesson-1',
        title: 'Titre de la leçon',
        slug: 'slug-lecon',
        difficulty: 'NOVICE',
      });

      const result = await service.findOne('rep-1');
      expect(result.id).toBe('rep-1');
      expect(result.targetDetails?.title).toBe('Titre de la leçon');
    });

    it('devrait lever NotFoundException si le signalement n’existe pas', async () => {
      mockPrisma.contentReport.findUnique.mockResolvedValue(null);

      await expect(service.findOne('rep-404')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('devrait mettre à jour le statut du signalement', async () => {
      mockPrisma.contentReport.findUnique.mockResolvedValue({ id: 'rep-1' });
      mockPrisma.contentReport.update.mockResolvedValue({
        id: 'rep-1',
        status: ReportStatus.RESOLVED,
      });

      const result = await service.updateStatus('rep-1', ReportStatus.RESOLVED);
      expect(result.status).toBe(ReportStatus.RESOLVED);
    });

    it('devrait lever NotFoundException si le signalement n’existe pas lors de la mise à jour', async () => {
      mockPrisma.contentReport.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('rep-404', ReportStatus.RESOLVED),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('devrait supprimer le signalement', async () => {
      mockPrisma.contentReport.findUnique.mockResolvedValue({ id: 'rep-1' });
      mockPrisma.contentReport.delete.mockResolvedValue({ id: 'rep-1' });

      const result = await service.delete('rep-1');
      expect(result.success).toBe(true);
    });

    it('devrait lever NotFoundException si le signalement n’existe pas lors de la suppression', async () => {
      mockPrisma.contentReport.findUnique.mockResolvedValue(null);

      await expect(service.delete('rep-404')).rejects.toThrow(NotFoundException);
    });
  });
});
