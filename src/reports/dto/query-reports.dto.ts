import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportStatus, ReportType } from '@prisma/client';

export class QueryReportsDto {
  @ApiPropertyOptional({
    enum: ReportStatus,
    description: 'Filtrer par statut (PENDING, RESOLVED, DISMISSED)',
  })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({
    enum: ReportType,
    description: 'Filtrer par type de contenu (LESSON, QUIZ)',
  })
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Numéro de page pour la pagination',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    description: 'Nombre de signalements par page (max 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
