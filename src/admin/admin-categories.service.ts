import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class AdminCategoriesService {
  private readonly logger = new Logger(AdminCategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            quizzes: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        lessons: {
          select: {
            id: true,
            title: true,
            slug: true,
            orderIndex: true,
            isPublished: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
        quizzes: {
          select: {
            id: true,
            title: true,
            orderIndex: true,
            isPublished: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: {
            lessons: true,
            quizzes: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Catégorie "${id}" introuvable.`);
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug.toLowerCase().trim();

    // 1. Vérification unicité du slug
    const existingSlug = await this.prisma.category.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(
        `Une catégorie avec le slug "${slug}" existe déjà.`,
      );
    }

    // 2. Vérification existence des tags si fournis
    if (dto.tagIds && dto.tagIds.length > 0) {
      const existingTags = await this.prisma.tag.findMany({
        where: { id: { in: dto.tagIds } },
      });
      if (existingTags.length !== dto.tagIds.length) {
        throw new NotFoundException(
          'Un ou plusieurs tags spécifiés sont introuvables.',
        );
      }
    }

    const category = await this.prisma.category.create({
      data: {
        slug,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        icon: dto.icon?.trim() || null,
        orderIndex: dto.orderIndex ?? 0,
        ...(dto.tagIds && dto.tagIds.length > 0
          ? {
              tags: {
                create: dto.tagIds.map((tagId) => ({ tagId })),
              },
            }
          : {}),
      },
      include: {
        tags: {
          include: { tag: true },
        },
        _count: {
          select: { lessons: true, quizzes: true },
        },
      },
    });

    this.logger.log(
      `Catégorie créée par l'administrateur : ${category.name} (${category.id})`,
    );
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Catégorie "${id}" introuvable.`);
    }

    // Si le slug est modifié, vérifier qu'il n'est pas déjà pris
    if (dto.slug) {
      const slug = dto.slug.toLowerCase().trim();
      if (slug !== existing.slug) {
        const slugTaken = await this.prisma.category.findUnique({
          where: { slug },
        });
        if (slugTaken) {
          throw new ConflictException(
            `Le slug "${slug}" est déjà utilisé par une autre catégorie.`,
          );
        }
      }
    }

    // Si les tags sont mis à jour, vérifier leur existence
    if (dto.tagIds !== undefined && dto.tagIds.length > 0) {
      const existingTags = await this.prisma.tag.findMany({
        where: { id: { in: dto.tagIds } },
      });
      if (existingTags.length !== dto.tagIds.length) {
        throw new NotFoundException(
          'Un ou plusieurs tags spécifiés sont introuvables.',
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.tagIds !== undefined) {
        await tx.tagOnCategory.deleteMany({
          where: { categoryId: id },
        });
        if (dto.tagIds.length > 0) {
          await tx.tagOnCategory.createMany({
            data: dto.tagIds.map((tagId) => ({ categoryId: id, tagId })),
          });
        }
      }

      return tx.category.update({
        where: { id },
        data: {
          ...(dto.slug ? { slug: dto.slug.toLowerCase().trim() } : {}),
          ...(dto.name ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.icon !== undefined ? { icon: dto.icon?.trim() || null } : {}),
          ...(dto.orderIndex !== undefined
            ? { orderIndex: dto.orderIndex }
            : {}),
        },
        include: {
          tags: {
            include: { tag: true },
          },
          _count: {
            select: { lessons: true, quizzes: true },
          },
        },
      });
    });

    this.logger.log(
      `Catégorie mise à jour par l'administrateur : ${updated.name} (${updated.id})`,
    );
    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Catégorie "${id}" introuvable.`);
    }

    await this.prisma.category.delete({
      where: { id },
    });

    this.logger.log(
      `Catégorie supprimée par l'administrateur : ${existing.name} (${id})`,
    );
    return {
      success: true,
      message: 'La catégorie a été supprimée avec succès.',
    };
  }

  async attachTag(categoryId: string, tagId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Catégorie "${categoryId}" introuvable.`);
    }

    const tag = await this.prisma.tag.findUnique({
      where: { id: tagId },
    });
    if (!tag) {
      throw new NotFoundException(`Tag "${tagId}" introuvable.`);
    }

    await this.prisma.tagOnCategory.upsert({
      where: {
        categoryId_tagId: { categoryId, tagId },
      },
      update: {},
      create: { categoryId, tagId },
    });

    this.logger.log(
      `Tag "${tag.name}" associé à la catégorie "${category.name}".`,
    );
    return {
      success: true,
      message: `Le tag "${tag.name}" a été associé à la catégorie avec succès.`,
    };
  }

  async detachTag(categoryId: string, tagId: string) {
    const relation = await this.prisma.tagOnCategory.findUnique({
      where: {
        categoryId_tagId: { categoryId, tagId },
      },
    });

    if (!relation) {
      throw new NotFoundException(
        `Le tag "${tagId}" n'est pas associé à la catégorie "${categoryId}".`,
      );
    }

    await this.prisma.tagOnCategory.delete({
      where: {
        categoryId_tagId: { categoryId, tagId },
      },
    });

    this.logger.log(`Tag "${tagId}" dissocié de la catégorie "${categoryId}".`);
    return {
      success: true,
      message: 'Le tag a été dissocié de la catégorie avec succès.',
    };
  }
}
