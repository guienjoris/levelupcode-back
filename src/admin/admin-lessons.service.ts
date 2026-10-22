import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLessonDto } from './dto/create-lesson.dto.js';
import { UpdateLessonDto } from './dto/update-lesson.dto.js';

@Injectable()
export class AdminLessonsService {
  private readonly logger = new Logger(AdminLessonsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: { categoryId?: string; isPublished?: boolean }) {
    return this.prisma.lesson.findMany({
      where: {
        ...(params?.categoryId ? { categoryId: params.categoryId } : {}),
        ...(params?.isPublished !== undefined
          ? { isPublished: params.isPublished }
          : {}),
      },
      orderBy: [{ categoryId: 'asc' }, { orderIndex: 'asc' }],
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        quizzes: {
          select: { id: true, title: true },
        },
        _count: {
          select: { progress: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        quizzes: {
          select: { id: true, title: true, isPublished: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Leçon "${id}" introuvable.`);
    }

    return lesson;
  }

  async create(dto: CreateLessonDto) {
    const slug = dto.slug.toLowerCase().trim();

    // 1. Vérification unicité du slug
    const existingSlug = await this.prisma.lesson.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(
        `Une leçon avec le slug "${slug}" existe déjà.`,
      );
    }

    // 2. Vérification existence de la catégorie
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(
        `Catégorie avec l'identifiant "${dto.categoryId}" introuvable.`,
      );
    }

    const lesson = await this.prisma.lesson.create({
      data: {
        slug,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        contentMarkdown: dto.contentMarkdown,
        difficulty: dto.difficulty,
        orderIndex: dto.orderIndex ?? 0,
        categoryId: dto.categoryId,
        isPublished: dto.isPublished ?? true,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    this.logger.log(
      `Leçon créée par l'administrateur : ${lesson.title} (${lesson.id})`,
    );
    return lesson;
  }

  async update(id: string, dto: UpdateLessonDto) {
    const existingLesson = await this.prisma.lesson.findUnique({
      where: { id },
    });
    if (!existingLesson) {
      throw new NotFoundException(`Leçon "${id}" introuvable.`);
    }

    // Si le slug est modifié, vérifier qu'il n'est pas déjà pris par une autre leçon
    if (dto.slug) {
      const slug = dto.slug.toLowerCase().trim();
      if (slug !== existingLesson.slug) {
        const slugTaken = await this.prisma.lesson.findUnique({
          where: { slug },
        });
        if (slugTaken) {
          throw new ConflictException(
            `Le slug "${slug}" est déjà utilisé par une autre leçon.`,
          );
        }
      }
    }

    // Si la catégorie est modifiée, vérifier son existence
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Catégorie "${dto.categoryId}" introuvable.`,
        );
      }
    }

    const updated = await this.prisma.lesson.update({
      where: { id },
      data: {
        ...(dto.slug ? { slug: dto.slug.toLowerCase().trim() } : {}),
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.contentMarkdown
          ? { contentMarkdown: dto.contentMarkdown }
          : {}),
        ...(dto.difficulty ? { difficulty: dto.difficulty } : {}),
        ...(dto.orderIndex !== undefined ? { orderIndex: dto.orderIndex } : {}),
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
        ...(dto.isPublished !== undefined
          ? { isPublished: dto.isPublished }
          : {}),
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    this.logger.log(
      `Leçon mise à jour par l'administrateur : ${updated.title} (${updated.id})`,
    );
    return updated;
  }

  async remove(id: string) {
    const existingLesson = await this.prisma.lesson.findUnique({
      where: { id },
    });
    if (!existingLesson) {
      throw new NotFoundException(`Leçon "${id}" introuvable.`);
    }

    await this.prisma.lesson.delete({
      where: { id },
    });

    this.logger.log(
      `Leçon supprimée par l'administrateur : ${existingLesson.title} (${id})`,
    );
    return {
      success: true,
      message: 'La leçon a été supprimée avec succès.',
    };
  }
}
