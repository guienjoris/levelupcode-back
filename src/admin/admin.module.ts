import { Module } from '@nestjs/common';
import { AdminLessonsController } from './admin-lessons.controller.js';
import { AdminLessonsService } from './admin-lessons.service.js';
import { AdminQuizzesController } from './admin-quizzes.controller.js';
import { AdminQuizzesService } from './admin-quizzes.service.js';

@Module({
  controllers: [AdminLessonsController, AdminQuizzesController],
  providers: [AdminLessonsService, AdminQuizzesService],
  exports: [AdminLessonsService, AdminQuizzesService],
})
export class AdminModule {}
