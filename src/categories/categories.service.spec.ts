import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  const mockPrisma = {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  it('findAll devrait retourner toutes les catégories avec leurs tags et compteurs', async () => {
    mockPrisma.category.findMany.mockResolvedValue([
      {
        id: 'cat-1',
        slug: 'nestjs',
        name: 'NestJS',
        description: 'Framework back-end',
        icon: 'logos:nestjs',
        orderIndex: 4,
        tags: [{ tag: { id: 't-1', slug: 'back-end', name: 'Back-End' } }],
        _count: { lessons: 10, quizzes: 5 },
      },
    ]);

    const result = await service.findAll();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('nestjs');
    expect(result[0].tags[0].name).toBe('Back-End');
    expect(result[0].lessonsCount).toBe(10);
    expect(result[0].quizzesCount).toBe(5);
  });

  it('findBySlug devrait retourner la catégorie demandée', async () => {
    mockPrisma.category.findUnique.mockResolvedValue({
      id: 'cat-1',
      slug: 'react',
      name: 'React',
      description: 'UI',
      icon: 'logos:react',
      orderIndex: 3,
      tags: [],
      _count: { lessons: 8, quizzes: 4 },
    });

    const result = await service.findBySlug('react');
    expect(result.name).toBe('React');
  });

  it('findBySlug devrait lever NotFoundException si la catégorie n’existe pas', async () => {
    mockPrisma.category.findUnique.mockResolvedValue(null);

    await expect(service.findBySlug('inconnue')).rejects.toThrow(
      NotFoundException,
    );
  });
});
