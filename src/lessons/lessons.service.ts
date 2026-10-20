import { Injectable, NotFoundException } from '@nestjs/common';
import { Difficulty } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProgressService } from '../common/progress/progress.service.js';
import {
  LessonSummaryDto,
  LessonDetailDto,
  LessonCompletionResultDto,
} from './dto/lesson-response.dto.js';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService,
  ) {}

  async findByCategory(
    categorySlug: string,
    userId: string,
    difficulty?: Difficulty,
  ): Promise<LessonSummaryDto[]> {
    const category = await this.prisma.category.findUnique({
      where: { slug: categorySlug.toLowerCase() },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException(`Catégorie "${categorySlug}" introuvable.`);
    }

    const lessons = await this.prisma.lesson.findMany({
      where: {
        categoryId: category.id,
        isPublished: true,
        ...(difficulty ? { difficulty } : {}),
      },
      orderBy: { orderIndex: 'asc' },
      include: {
        quizzes: {
          where: { isPublished: true },
          select: { id: true },
        },
        progress: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    return lessons.map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      description: lesson.description,
      difficulty: lesson.difficulty,
      orderIndex: lesson.orderIndex,
      categoryId: lesson.categoryId,
      isCompleted: lesson.progress.length > 0,
      hasQuiz: lesson.quizzes.length > 0,
    }));
  }

  async findOne(idOrSlug: string, userId: string): Promise<LessonDetailDto> {
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(idOrSlug);

    const lesson = await this.prisma.lesson.findFirst({
      where: {
        ...(isUuid ? { id: idOrSlug } : { slug: idOrSlug.toLowerCase() }),
        isPublished: true,
      },
      include: {
        category: {
          select: { name: true },
        },
        quizzes: {
          where: { isPublished: true },
          select: { id: true },
          take: 1,
        },
        progress: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Leçon "${idOrSlug}" introuvable.`);
    }

    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      description: lesson.description,
      difficulty: lesson.difficulty,
      orderIndex: lesson.orderIndex,
      categoryId: lesson.categoryId,
      categoryName: lesson.category.name,
      contentMarkdown: lesson.contentMarkdown,
      isCompleted: lesson.progress.length > 0,
      hasQuiz: lesson.quizzes.length > 0,
      quizId: lesson.quizzes[0]?.id || null,
    };
  }

  async completeLesson(
    lessonId: string,
    userId: string,
  ): Promise<LessonCompletionResultDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(`Leçon "${lessonId}" introuvable.`);
    }

    const reward = await this.progressService.recordActivity({
      userId,
      categoryId: lesson.categoryId,
      difficulty: lesson.difficulty,
      lessonId: lesson.id,
    });

    return {
      isNewCompletion: reward.isNewCompletion,
      xpEarned: reward.xpEarned,
      currentStreak: reward.currentStreak,
      longestStreak: reward.longestStreak,
    };
  }
}
