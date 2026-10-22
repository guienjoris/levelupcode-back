import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service.js';
import { QuizDetailDto } from './dto/quiz-response.dto.js';
import { SubmitQuizDto } from './dto/submit-quiz.dto.js';
import { QuizResultDto } from './dto/quiz-result.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Quizzes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get(':id')
  @ApiOperation({
    summary:
      'Consultation d’un quiz et de ses questions (Membres connectés uniquement)',
    description:
      'Retourne les questions et choix possibles du quiz. Les bonnes réponses restent masquées jusqu’à la soumission.',
  })
  @ApiParam({
    name: 'id',
    example: 'z1b2c3d4-0000-0000-0000-000000000001',
    description: 'UUID du quiz',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails du quiz et questions',
    type: QuizDetailDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Accès non autorisé : inscription / authentification requise',
  })
  @ApiResponse({
    status: 404,
    description: 'Quiz introuvable',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<QuizDetailDto> {
    return this.quizzesService.findOne(id, userId);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Soumission des réponses et évaluation du quiz (Membres connectés uniquement)',
    description:
      'Corrige les réponses fournies, calcule le score, renvoie les explications détaillées et met à jour le streak.',
  })
  @ApiParam({
    name: 'id',
    example: 'z1b2c3d4-0000-0000-0000-000000000001',
    description: 'UUID du quiz à soumettre',
  })
  @ApiResponse({
    status: 200,
    description:
      'Résultat du quiz avec correction et explications pédagogiques',
    type: QuizResultDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Accès non autorisé : inscription / authentification requise',
  })
  @ApiResponse({
    status: 404,
    description: 'Quiz introuvable',
  })
  async submitQuiz(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitQuizDto,
  ): Promise<QuizResultDto> {
    return this.quizzesService.submitQuiz(id, userId, dto);
  }
}
