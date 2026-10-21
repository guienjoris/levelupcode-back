import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { LessonsModule } from './lessons/lessons.module.js';
import { QuizzesModule } from './quizzes/quizzes.module.js';
import { ProgressModule } from './common/progress/progress.module.js';
import { AdminModule } from './admin/admin.module.js';
import { GamificationModule } from './gamification/gamification.module.js';
import { ThrottlerModule } from '@nestjs/throttler';
import { MailModule } from './mail/mail.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { DonationsModule } from './donations/donations.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    PrismaModule,
    ProgressModule,
    MailModule,
    NotificationsModule,
    ReportsModule,
    DonationsModule,
    AuthModule,
    CategoriesModule,
    LessonsModule,
    QuizzesModule,
    AdminModule,
    GamificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
