import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CategorySummaryDto } from './dto/category-response.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<CategorySummaryDto[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        tags: {
          include: { tag: true },
        },
        _count: {
          select: {
            lessons: { where: { isPublished: true } },
            quizzes: { where: { isPublished: true } },
          },
        },
      },
    });

    return categories.map((cat) => this.mapCategory(cat));
  }

  async findBySlug(slug: string): Promise<CategorySummaryDto> {
    const category = await this.prisma.category.findUnique({
      where: { slug: slug.toLowerCase() },
      include: {
        tags: {
          include: { tag: true },
        },
        _count: {
          select: {
            lessons: { where: { isPublished: true } },
            quizzes: { where: { isPublished: true } },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Catégorie "${slug}" introuvable.`);
    }

    return this.mapCategory(category);
  }

  private mapCategory(cat: any): CategorySummaryDto {
    return {
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      orderIndex: cat.orderIndex,
      tags: cat.tags.map((t: any) => ({
        id: t.tag.id,
        slug: t.tag.slug,
        name: t.tag.name,
      })),
      lessonsCount: cat._count.lessons,
      quizzesCount: cat._count.quizzes,
    };
  }
}
