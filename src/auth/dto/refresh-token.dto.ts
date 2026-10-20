import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh Token valide délivré lors de la connexion',
  })
  @IsString({ message: 'Le refresh token doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le refresh token est requis.' })
  refreshToken: string;
}
