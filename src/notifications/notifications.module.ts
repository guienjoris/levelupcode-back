import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { CronSecretGuard } from './guards/cron-secret.guard.js';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, CronSecretGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
