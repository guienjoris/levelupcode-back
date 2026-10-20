import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateQuizDto, CreateAdminQuestionDto } from './dto/create-quiz.dto.js';
import { UpdateQuizDto } from './dto/update-quiz.dto.js';

@Injectable()
export class AdminQuizzesService {
  private readonly logger = new Logger(AdminQuizzesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: { categoryId?: string; isPublished?: boolean }) {
    return this.prisma.quiz.findMany({
      where: {
        ...(params?.categoryId ? { categoryId: params.categoryId } : {}),
        ...(params?.isPublished !== undefined ? { isPublished: params.isPublished } : {}),
      },
      orderBy: [{ categoryId: 'asc' }, { orderIndex: 'asc' }],
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        lesson: {
          select: { id: true, title: true, slug: true },
        },
        _count: {
          select: { questions: true, progress: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        lesson: {
          select: { id: true, title: true, slug: true },
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            answers: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz "${id}" introuvable.`);
    }

    return quiz;
  }

  async create(dto: CreateQuizDto) {
    // 1. Vérification de la catégorie
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Catégorie "${dto.categoryId}" introuvable.`);
    }

    // 2. Vérification de la leçon si fournie
    if (dto.lessonId) {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: dto.lessonId },
      });
      if (!lesson) {
        throw new NotFoundException(`Leçon "${dto.lessonId}" introuvable.`);
      }
    }

    // 3. Validation de cohérence des questions et réponses
    for (const [index, q] of dto.questions.entries()) {
      const hasCorrectAnswer = q.answers.some((a) => a.isCorrect === true);
      if (!hasCorrectAnswer) {
        throw new BadRequestException(
          `La question ${index + 1} ("${q.title}") ne comporte aucune réponse exacte (isCorrect=true).`,
        );
      }
    }

    // 4. Création atomique du quiz, des questions et des réponses
    const createdQuiz = await this.prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          difficulty: dto.difficulty,
          categoryId: dto.categoryId,
          lessonId: dto.lessonId || null,
          orderIndex: dto.orderIndex ?? 0,
          isPublished: dto.isPublished ?? true,
          questions: {
            create: dto.questions.map((q, qIndex) => ({
              title: q.title.trim(),
              codeSnippet: q.codeSnippet?.trim() || null,
              explanation: q.explanation?.trim() || null,
              orderIndex: q.orderIndex ?? qIndex + 1,
              answers: {
                create: q.answers.map((a, aIndex) => ({
                  text: a.text.trim(),
                  isCorrect: a.isCorrect,
                  orderIndex: a.orderIndex ?? aIndex + 1,
                })),
              },
            })),
          },
        },
        include: {
          questions: {
            include: {
              answers: true,
            },
          },
        },
      });

      return quiz;
    });

    this.logger.log(`Quiz créé par l'administrateur : ${createdQuiz.title} (${createdQuiz.id})`);
    return createdQuiz;
  }

  async update(id: string, dto: UpdateQuizDto) {
    const existing = await this.prisma.quiz.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Quiz "${id}" introuvable.`);
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Catégorie "${dto.categoryId}" introuvable.`);
      }
    }

    if (dto.lessonId) {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: dto.lessonId },
      });
      if (!lesson) {
        throw new NotFoundException(`Leçon "${dto.lessonId}" introuvable.`);
      }
    }

    const updated = await this.prisma.quiz.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.difficulty ? { difficulty: dto.difficulty } : {}),
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
        ...(dto.lessonId !== undefined ? { lessonId: dto.lessonId || null } : {}),
        ...(dto.orderIndex !== undefined ? { orderIndex: dto.orderIndex } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
      },
      include: {
        category: { select: { name: true } },
        lesson: { select: { title: true } },
      },
    });

    this.logger.log(`Quiz mis à jour par l'administrateur : ${updated.title} (${updated.id})`);
    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.quiz.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Quiz "${id}" introuvable.`);
    }

    await this.prisma.quiz.delete({
      where: { id },
    });

    this.logger.log(`Quiz supprimé par l'administrateur : ${existing.title} (${id})`);
    return {
      success: true,
      message: 'Le quiz et l’ensemble de ses questions ont été supprimés avec succès.',
    };
  }

  async addQuestion(quizId: string, dto: CreateAdminQuestionDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz "${quizId}" introuvable.`);
    }

    const hasCorrect = dto.answers.some((a) => a.isCorrect === true);
    if (!hasCorrect) {
      throw new BadRequestException('La question doit comporter au moins une réponse exacte (isCorrect=true).');
    }

    return this.prisma.question.create({
      data: {
        quizId,
        title: dto.title.trim(),
        codeSnippet: dto.codeSnippet?.trim() || null,
        explanation: dto.explanation?.trim() || null,
        orderIndex: dto.orderIndex ?? 0,
        answers: {
          create: dto.answers.map((a, idx) => ({
            text: a.text.trim(),
            isCorrect: a.isCorrect,
            orderIndex: a.orderIndex ?? idx + 1,
          })),
        },
      },
      include: {
        answers: true,
      },
    });
  }

  async deleteQuestion(questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      throw new NotFoundException(`Question "${questionId}" introuvable.`);
    }

    await this.prisma.question.delete({
      where: { id: questionId },
    });

    return {
      success: true,
      message: 'La question a été supprimée avec succès.',
    };
  }
}
