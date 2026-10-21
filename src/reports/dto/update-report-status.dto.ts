import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class UpdateReportStatusDto {
  @ApiProperty({
    enum: ReportStatus,
    example: ReportStatus.RESOLVED,
    description: 'Nouveau statut du signalement (PENDING, RESOLVED, DISMISSED)',
  })
  @IsEnum(ReportStatus, {
    message: 'Le statut doit être PENDING, RESOLVED ou DISMISSED.',
  })
  status: ReportStatus;
}
