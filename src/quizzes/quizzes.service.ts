import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProgressService } from '../common/progress/progress.service.js';
import { QuizDetailDto } from './dto/quiz-response.dto.js';
import { SubmitQuizDto } from './dto/submit-quiz.dto.js';
import { QuizResultDto, QuestionCorrectionDto } from './dto/quiz-result.dto.js';

@Injectable()
export class QuizzesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService,
  ) {}

  async findOne(id: string, userId: string): Promise<QuizDetailDto> {
    const quiz = await this.prisma.quiz.findFirst({
      where: {
        id,
        isPublished: true,
      },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            answers: {
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                text: true,
                orderIndex: true,
                // On exclut volontairement isCorrect pour masquer les réponses
              },
            },
          },
        },
        progress: {
          where: { userId },
          select: { score: true },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz "${id}" introuvable.`);
    }

    const bestScore =
      quiz.progress.length > 0
        ? Math.max(...quiz.progress.map((p) => p.score ?? 0))
        : null;

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      difficulty: quiz.difficulty,
      categoryId: quiz.categoryId,
      lessonId: quiz.lessonId,
      questionsCount: quiz.questions.length,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        title: q.title,
        codeSnippet: q.codeSnippet,
        orderIndex: q.orderIndex,
        answers: q.answers,
      })),
      userBestScore: bestScore,
    };
  }

  async submitQuiz(
    quizId: string,
    userId: string,
    dto: SubmitQuizDto,
  ): Promise<QuizResultDto> {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: quizId, isPublished: true },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            answers: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz "${quizId}" introuvable.`);
    }

    const totalQuestions = quiz.questions.length;
    if (totalQuestions === 0) {
      throw new BadRequestException('Ce quiz ne contient aucune question.');
    }

    const userAnswersMap = new Map<string, string>();
    for (const ans of dto.answers) {
      userAnswersMap.set(ans.questionId, ans.selectedAnswerId);
    }

    let correctCount = 0;
    const corrections: QuestionCorrectionDto[] = [];

    for (const question of quiz.questions) {
      const selectedAnswerId = userAnswersMap.get(question.id) || '';
      const correctAnswer = question.answers.find((a) => a.isCorrect);
      const isCorrect = correctAnswer
        ? selectedAnswerId === correctAnswer.id
        : false;

      if (isCorrect) {
        correctCount += 1;
      }

      corrections.push({
        questionId: question.id,
        selectedAnswerId,
        correctAnswerId: correctAnswer?.id || '',
        isCorrect,
        explanation: question.explanation,
      });
    }

    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 70;

    // Si le quiz est réussi (>= 70%), on enregistre l'activité, calcule l'XP et le streak
    const reward = await this.progressService.recordActivity({
      userId,
      categoryId: quiz.categoryId,
      difficulty: quiz.difficulty,
      quizId: quiz.id,
      score,
    });

    return {
      quizId: quiz.id,
      score,
      passed,
      totalQuestions,
      correctCount,
      corrections,
      reward: {
        isNewCompletion: reward.isNewCompletion,
        xpEarned: passed ? reward.xpEarned : 0,
        currentStreak: reward.currentStreak,
        longestStreak: reward.longestStreak,
      },
    };
  }
}
