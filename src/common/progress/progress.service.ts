import { Injectable, Logger } from '@nestjs/common';
import { Difficulty, UserStreak } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface ProgressReward {
  isNewCompletion: boolean;
  xpEarned: number;
  currentStreak: number;
  longestStreak: number;
}

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enregistre l'achèvement d'une leçon ou d'un quiz, met à jour le streak et attribue l'XP.
   */
  async recordActivity(params: {
    userId: string;
    categoryId: string;
    difficulty: Difficulty;
    lessonId?: string;
    quizId?: string;
    score?: number;
  }): Promise<ProgressReward> {
    const { userId, categoryId, difficulty, lessonId, quizId, score } = params;

    // 1. Vérifier si l'activité a déjà été complétée auparavant
    const existingProgress = await this.prisma.userProgress.findFirst({
      where: {
        userId,
        ...(lessonId ? { lessonId } : {}),
        ...(quizId ? { quizId } : {}),
      },
    });

    const isNewCompletion = !existingProgress;

    // 2. Enregistrer / mettre à jour l'achèvement dans UserProgress
    if (existingProgress) {
      if (score !== undefined) {
        await this.prisma.userProgress.update({
          where: { id: existingProgress.id },
          data: {
            score: Math.max(existingProgress.score ?? 0, score),
            completedAt: new Date(),
          },
        });
      }
    } else {
      await this.prisma.userProgress.create({
        data: {
          userId,
          lessonId: lessonId || null,
          quizId: quizId || null,
          score: score ?? 100,
          completedAt: new Date(),
        },
      });
    }

    // 3. Calcul de l'XP
    const xpPoints = this.calculateXp(difficulty);
    const xpEarned = isNewCompletion ? xpPoints : 0;

    if (xpEarned > 0) {
      await this.prisma.userScore.upsert({
        where: {
          userId_categoryId: {
            userId,
            categoryId,
          },
        },
        update: {
          xp: { increment: xpEarned },
        },
        create: {
          userId,
          categoryId,
          xp: xpEarned,
        },
      });

      // Mettre à jour également l'XP pour les tags rattachés à cette catégorie
      const categoryTags = await this.prisma.tagOnCategory.findMany({
        where: { categoryId },
        select: { tagId: true },
      });

      for (const { tagId } of categoryTags) {
        await this.prisma.userScore.upsert({
          where: {
            userId_tagId: {
              userId,
              tagId,
            },
          },
          update: {
            xp: { increment: xpEarned },
          },
          create: {
            userId,
            tagId,
            xp: xpEarned,
          },
        });
      }
    }

    // 4. Mise à jour du streak quotidien de l'utilisateur
    const streak = await this.updateUserStreak(userId);

    return {
      isNewCompletion,
      xpEarned,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
    };
  }

  private calculateXp(difficulty: Difficulty): number {
    switch (difficulty) {
      case Difficulty.SENIOR:
        return 30;
      case Difficulty.INTERMEDIAIRE:
        return 20;
      case Difficulty.NOVICE:
      default:
        return 10;
    }
  }

  private async updateUserStreak(userId: string): Promise<UserStreak> {
    const streak = await this.prisma.userStreak.findUnique({
      where: { userId },
    });

    const now = new Date();

    if (!streak) {
      return this.prisma.userStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: now,
        },
      });
    }

    const lastActive = streak.lastActiveDate;
    if (!lastActive) {
      return this.prisma.userStreak.update({
        where: { userId },
        data: {
          currentStreak: 1,
          longestStreak: Math.max(streak.longestStreak, 1),
          lastActiveDate: now,
        },
      });
    }

    // Comparaison des dates (en jours calendaires UTC)
    const lastDateMidnight = new Date(
      Date.UTC(
        lastActive.getUTCFullYear(),
        lastActive.getUTCMonth(),
        lastActive.getUTCDate(),
      ),
    );
    const nowDateMidnight = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const diffDays = Math.round(
      (nowDateMidnight.getTime() - lastDateMidnight.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) {
      // Déjà actif aujourd'hui : le streak est préservé, on met simplement à jour l'horodatage
      return this.prisma.userStreak.update({
        where: { userId },
        data: { lastActiveDate: now },
      });
    }

    if (diffDays === 1) {
      // Actif le jour consécutif : streak + 1
      const newCurrent = streak.currentStreak + 1;
      const newLongest = Math.max(streak.longestStreak, newCurrent);

      return this.prisma.userStreak.update({
        where: { userId },
        data: {
          currentStreak: newCurrent,
          longestStreak: newLongest,
          lastActiveDate: now,
        },
      });
    }

    // Plus d'un jour d'interruption : le streak retombe à 1
    return this.prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        lastActiveDate: now,
      },
    });
  }
}
