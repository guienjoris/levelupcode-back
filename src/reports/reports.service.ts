import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ReportStatus, ReportType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { QueryReportsDto } from './dto/query-reports.dto.js';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Crée un nouveau signalement de contenu (Leçon ou Quiz),
   * l'enregistre en base de données et alerte immédiatement l'administrateur par email.
   */
  async create(
    dto: CreateReportDto,
    user?: { id: string; email?: string } | null,
  ) {
    let resolvedTargetId = dto.targetId;
    let targetTitle: string | null = null;

    if (dto.type === ReportType.LESSON) {
      const lesson = await this.prisma.lesson.findFirst({
        where: {
          OR: [{ id: dto.targetId }, { slug: dto.targetId }],
        },
        select: { id: true, title: true },
      });

      if (!lesson) {
        throw new NotFoundException(
          `Aucune leçon trouvée pour l'identifiant ou slug "${dto.targetId}".`,
        );
      }
      resolvedTargetId = lesson.id;
      targetTitle = lesson.title;
    } else if (dto.type === ReportType.QUIZ) {
      const quiz = await this.prisma.quiz.findUnique({
        where: { id: dto.targetId },
        select: { id: true, title: true },
      });

      if (!quiz) {
        throw new NotFoundException(
          `Aucun quiz trouvé pour l'identifiant "${dto.targetId}".`,
        );
      }
      resolvedTargetId = quiz.id;
      targetTitle = quiz.title;
    }

    const report = await this.prisma.contentReport.create({
      data: {
        type: dto.type,
        targetId: resolvedTargetId,
        comment: dto.comment,
        userId: user?.id ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Envoi immédiat de l'email d'alerte à l'administrateur
    try {
      await this.mailService.sendAdminErrorReport({
        type: dto.type,
        targetId: resolvedTargetId,
        comment: dto.comment,
        userEmail: user?.email ?? null,
        date: report.createdAt,
      });
    } catch (error) {
      this.logger.error(
        `Échec de l'envoi de l'email admin pour le signalement ${report.id} :`,
        error,
      );
    }

    return {
      success: true,
      message:
        'Votre signalement a été enregistré avec succès et transmis à l’administrateur. Merci pour votre aide !',
      report: {
        ...report,
        targetTitle,
      },
    };
  }

  /**
   * Consultation paginée des signalements pour le panneau d'administration.
   */
  async findAll(query: QueryReportsDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.type) {
      where.type = query.type;
    }

    const [reports, total] = await Promise.all([
      this.prisma.contentReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.contentReport.count({ where }),
    ]);

    // Enrichissement par batch des titres des leçons et quiz
    const lessonIds = reports
      .filter((r) => r.type === ReportType.LESSON)
      .map((r) => r.targetId);
    const quizIds = reports
      .filter((r) => r.type === ReportType.QUIZ)
      .map((r) => r.targetId);

    const [lessons, quizzes] = await Promise.all([
      lessonIds.length > 0
        ? this.prisma.lesson.findMany({
            where: { id: { in: lessonIds } },
            select: { id: true, title: true, slug: true },
          })
        : [],
      quizIds.length > 0
        ? this.prisma.quiz.findMany({
            where: { id: { in: quizIds } },
            select: { id: true, title: true },
          })
        : [],
    ]);

    const lessonMap = new Map(lessons.map((l) => [l.id, l]));
    const quizMap = new Map(quizzes.map((q) => [q.id, q]));

    const enrichedReports = reports.map((report) => {
      let targetDetails = null;
      if (report.type === ReportType.LESSON) {
        targetDetails = lessonMap.get(report.targetId) || null;
      } else if (report.type === ReportType.QUIZ) {
        targetDetails = quizMap.get(report.targetId) || null;
      }

      return {
        ...report,
        targetDetails,
      };
    });

    return {
      data: enrichedReports,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupère un signalement spécifique avec les détails de la ressource ciblée.
   */
  async findOne(id: string) {
    const report = await this.prisma.contentReport.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Le signalement #${id} n'existe pas.`);
    }

    let targetDetails = null;
    if (report.type === ReportType.LESSON) {
      targetDetails = await this.prisma.lesson.findUnique({
        where: { id: report.targetId },
        select: { id: true, title: true, slug: true, difficulty: true },
      });
    } else if (report.type === ReportType.QUIZ) {
      targetDetails = await this.prisma.quiz.findUnique({
        where: { id: report.targetId },
        select: { id: true, title: true, difficulty: true },
      });
    }

    return {
      ...report,
      targetDetails,
    };
  }

  /**
   * Met à jour le statut d'un signalement (PENDING -> RESOLVED | DISMISSED).
   */
  async updateStatus(id: string, status: ReportStatus) {
    const existing = await this.prisma.contentReport.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Le signalement #${id} n'existe pas.`);
    }

    const updated = await this.prisma.contentReport.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Supprime un signalement.
   */
  async delete(id: string) {
    const existing = await this.prisma.contentReport.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Le signalement #${id} n'existe pas.`);
    }

    await this.prisma.contentReport.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Le signalement #${id} a été supprimé avec succès.`,
    };
  }
}
