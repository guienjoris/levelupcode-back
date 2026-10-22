import { Module } from '@nestjs/common';
import { AdminLessonsController } from './admin-lessons.controller.js';
import { AdminLessonsService } from './admin-lessons.service.js';
import { AdminQuizzesController } from './admin-quizzes.controller.js';
import { AdminQuizzesService } from './admin-quizzes.service.js';
import { AdminCategoriesController } from './admin-categories.controller.js';
import { AdminCategoriesService } from './admin-categories.service.js';
import { AdminTagsController } from './admin-tags.controller.js';
import { AdminTagsService } from './admin-tags.service.js';

@Module({
  controllers: [
    AdminLessonsController,
    AdminQuizzesController,
    AdminCategoriesController,
    AdminTagsController,
  ],
  providers: [
    AdminLessonsService,
    AdminQuizzesService,
    AdminCategoriesService,
    AdminTagsService,
  ],
  exports: [
    AdminLessonsService,
    AdminQuizzesService,
    AdminCategoriesService,
    AdminTagsService,
  ],
})
export class AdminModule {}
