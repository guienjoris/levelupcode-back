import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'apprenant@example.com',
    description: "Adresse email unique de l'utilisateur",
  })
  @IsEmail({}, { message: "L'adresse email fournie n'est pas valide." })
  @IsNotEmpty({ message: "L'adresse email est requise." })
  email: string;

  @ApiProperty({
    example: 'MotDePasseSecurise123!',
    description: 'Mot de passe sécurisé (minimum 8 caractères)',
    minLength: 8,
    maxLength: 64,
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(64, { message: 'Le mot de passe ne peut pas dépasser 64 caractères.' })
  password: string;

  @ApiPropertyOptional({
    example: 'Alex Dupont',
    description: "Nom d'affichage ou prénom de l'utilisateur",
  })
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères.' })
  name?: string;
}
