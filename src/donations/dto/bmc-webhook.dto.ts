import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BmcWebhookDto {
  @ApiPropertyOptional({ example: 'donation.created' })
  @IsOptional()
  @IsString()
  type?: string;

  // Champs de premier niveau (format standard ou aplati)
  @ApiPropertyOptional({ example: 'bmc_tx_987654321' })
  @IsOptional()
  transaction_id?: string | number;

  @ApiPropertyOptional({ example: 'supporter@example.com' })
  @IsOptional()
  @IsString()
  supporter_email?: string;

  @ApiPropertyOptional({ example: 'Jean Dupont' })
  @IsOptional()
  @IsString()
  supporter_name?: string;

  @ApiPropertyOptional({ example: 5.0 })
  @IsOptional()
  amount?: number | string;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'Super plateforme de code !' })
  @IsOptional()
  @IsString()
  message?: string;

  // Objet imbriqué (format BMC event data ou response)
  @ApiPropertyOptional({ description: 'Payload imbriqué envoyé par Buy Me a Coffee' })
  @IsOptional()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Payload response envoyé par certains webhooks BMC' })
  @IsOptional()
  response?: Record<string, any>;
}
