import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { UpdateTagDto } from './dto/update-tag.dto.js';

@Injectable()
export class AdminTagsService {
  private readonly logger = new Logger(AdminTagsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: { categoryId?: string }) {
    return this.prisma.tag.findMany({
      where: {
        ...(params?.categoryId
          ? {
              categories: {
                some: { categoryId: params.categoryId },
              },
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            categories: true,
            scores: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            categories: true,
            scores: true,
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag "${id}" introuvable.`);
    }

    return tag;
  }

  async create(dto: CreateTagDto) {
    const slug = dto.slug.toLowerCase().trim();

    // 1. Vérification unicité du slug
    const existingSlug = await this.prisma.tag.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Un tag avec le slug "${slug}" existe déjà.`);
    }

    // 2. Vérification existence des catégories si fournies
    if (dto.categoryIds && dto.categoryIds.length > 0) {
      const existingCategories = await this.prisma.category.findMany({
        where: { id: { in: dto.categoryIds } },
      });
      if (existingCategories.length !== dto.categoryIds.length) {
        throw new NotFoundException(
          'Une ou plusieurs catégories spécifiées sont introuvables.',
        );
      }
    }

    const tag = await this.prisma.tag.create({
      data: {
        slug,
        name: dto.name.trim(),
        ...(dto.categoryIds && dto.categoryIds.length > 0
          ? {
              categories: {
                create: dto.categoryIds.map((categoryId) => ({ categoryId })),
              },
            }
          : {}),
      },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            categories: true,
          },
        },
      },
    });

    this.logger.log(`Tag créé par l'administrateur : ${tag.name} (${tag.id})`);
    return tag;
  }

  async update(id: string, dto: UpdateTagDto) {
    const existing = await this.prisma.tag.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Tag "${id}" introuvable.`);
    }

    // Si le slug est modifié, vérifier qu'il n'est pas déjà pris
    if (dto.slug) {
      const slug = dto.slug.toLowerCase().trim();
      if (slug !== existing.slug) {
        const slugTaken = await this.prisma.tag.findUnique({
          where: { slug },
        });
        if (slugTaken) {
          throw new ConflictException(
            `Le slug "${slug}" est déjà utilisé par un autre tag.`,
          );
        }
      }
    }

    // Si les catégories sont mises à jour, vérifier leur existence
    if (dto.categoryIds !== undefined && dto.categoryIds.length > 0) {
      const existingCategories = await this.prisma.category.findMany({
        where: { id: { in: dto.categoryIds } },
      });
      if (existingCategories.length !== dto.categoryIds.length) {
        throw new NotFoundException(
          'Une ou plusieurs catégories spécifiées sont introuvables.',
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.categoryIds !== undefined) {
        await tx.tagOnCategory.deleteMany({
          where: { tagId: id },
        });
        if (dto.categoryIds.length > 0) {
          await tx.tagOnCategory.createMany({
            data: dto.categoryIds.map((categoryId) => ({
              tagId: id,
              categoryId,
            })),
          });
        }
      }

      return tx.tag.update({
        where: { id },
        data: {
          ...(dto.slug ? { slug: dto.slug.toLowerCase().trim() } : {}),
          ...(dto.name ? { name: dto.name.trim() } : {}),
        },
        include: {
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          _count: {
            select: {
              categories: true,
            },
          },
        },
      });
    });

    this.logger.log(
      `Tag mis à jour par l'administrateur : ${updated.name} (${updated.id})`,
    );
    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.tag.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Tag "${id}" introuvable.`);
    }

    await this.prisma.tag.delete({
      where: { id },
    });

    this.logger.log(
      `Tag supprimé par l'administrateur : ${existing.name} (${id})`,
    );
    return {
      success: true,
      message: 'Le tag a été supprimé avec succès.',
    };
  }
}
