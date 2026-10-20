import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserProfileDto {
  @ApiProperty({ example: 'b1a8d052-a5ec-44ec-b42e-13c5914fa61e' })
  id: string;

  @ApiProperty({ example: 'apprenant@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'Alex Dupont' })
  name?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  avatarUrl?: string | null;

  @ApiProperty({ enum: Role, example: Role.USER })
  role: Role;

  @ApiProperty({ example: false })
  isSupporter: boolean;

  @ApiProperty({ example: 3 })
  currentStreak: number;

  @ApiProperty({ example: 7 })
  longestStreak: number;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Jeton JWT d’accès courte durée (15 minutes)',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Jeton JWT de rafraîchissement longue durée (7 jours)',
  })
  refreshToken: string;

  @ApiProperty({ type: () => UserProfileDto })
  user: UserProfileDto;
}
