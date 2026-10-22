import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @ApiProperty({
    example: true,
    description:
      'Activer ou désactiver les emails de rappel quotidien du soir pour sauver le streak',
  })
  @IsBoolean({ message: 'emailDailyReminder doit être un booléen.' })
  emailDailyReminder: boolean;
}
