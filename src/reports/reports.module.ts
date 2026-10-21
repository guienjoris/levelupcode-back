import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller.js';
import { AdminReportsController } from './admin-reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  controllers: [ReportsController, AdminReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
