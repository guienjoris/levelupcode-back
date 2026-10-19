import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Vérification de statut du service API' })
  @ApiResponse({ status: 200, description: 'Service opérationnel', type: String })
  getHello(): string {
    return this.appService.getHello();
  }
}
