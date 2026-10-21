import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DonationsController } from './donations.controller.js';
import { AdminDonationsController } from './admin-donations.controller.js';
import { DonationsService } from './donations.service.js';
import { BmcWebhookGuard } from './guards/bmc-webhook.guard.js';

@Module({
  imports: [ConfigModule],
  controllers: [DonationsController, AdminDonationsController],
  providers: [DonationsService, BmcWebhookGuard],
  exports: [DonationsService],
})
export class DonationsModule {}
