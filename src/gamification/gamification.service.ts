import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserStatsDto } from './dto/user-stats.dto.js';
import { LeaderboardQueryDto, LeaderboardEntryDto } from './dto/leaderboard.dto.js';

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserStats(userId: string): Promise<UserStatsDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        streak: true,
        progress: {
          select: { lessonId: true, quizId: true },
        },
        scores: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    // Calcul de l'ancienneté en jours
    const diffMs = Date.now() - user.createdAt.getTime();
    const daysSinceRegistration = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    // Compteurs de leçons et quiz complétés
    const completedLessonsCount = user.progress.filter((p) => p.lessonId !== null).length;
    const completedQuizzesCount = user.progress.filter((p) => p.quizId !== null).length;

    // Répartition de l'XP par catégorie
    const categoryScores = user.scores.filter((s) => s.categoryId && s.category);
    const xpByCategory = categoryScores.map((s) => ({
      categoryId: s.category!.id,
      categoryName: s.category!.name,
      categorySlug: s.category!.slug,
      xp: s.xp,
    }));

    // Total XP calculé sur les catégories (pour ne pas doubler avec les tags)
    const totalXp = xpByCategory.reduce((sum, c) => sum + c.xp, 0);

    // Répartition de l'XP par tag technique
    const tagScores = user.scores.filter((s) => s.tagId && s.tag);
    const xpByTag = tagScores.map((s) => ({
      tagId: s.tag!.id,
      tagName: s.tag!.name,
      tagSlug: s.tag!.slug,
      xp: s.xp,
    }));

    return {
      userId: user.id,
      currentStreak: user.streak?.currentStreak ?? 0,
      longestStreak: user.streak?.longestStreak ?? 0,
      lastActiveDate: user.streak?.lastActiveDate || null,
      totalXp,
      completedLessonsCount,
      completedQuizzesCount,
      daysSinceRegistration,
      isSupporter: user.isSupporter,
      xpByCategory,
      xpByTag,
    };
  }

  async getLeaderboard(query: LeaderboardQueryDto): Promise<{ total: number; entries: LeaderboardEntryDto[] }> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const sortBy = query.sortBy ?? 'xp';

    const users = await this.prisma.user.findMany({
      include: {
        streak: true,
        scores: {
          where: { categoryId: { not: null } },
          select: { xp: true },
        },
      },
    });

    const userStats = users.map((u) => {
      const totalXp = u.scores.reduce((sum, s) => sum + s.xp, 0);
      const name = u.name || u.email.split('@')[0];

      return {
        userId: u.id,
        name,
        avatarUrl: u.avatarUrl,
        totalXp,
        currentStreak: u.streak?.currentStreak ?? 0,
        longestStreak: u.streak?.longestStreak ?? 0,
        isSupporter: u.isSupporter,
      };
    });

    if (sortBy === 'streak') {
      userStats.sort((a, b) => b.longestStreak - a.longestStreak || b.totalXp - a.totalXp);
    } else {
      userStats.sort((a, b) => b.totalXp - a.totalXp || b.longestStreak - a.longestStreak);
    }

    const total = userStats.length;
    const paginated = userStats.slice(offset, offset + limit);

    const entries: LeaderboardEntryDto[] = paginated.map((entry, index) => ({
      rank: offset + index + 1,
      ...entry,
    }));

    return { total, entries };
  }
}
