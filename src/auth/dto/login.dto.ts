import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'apprenant@example.com',
    description: "Adresse email du compte",
  })
  @IsEmail({}, { message: "L'adresse email fournie n'est pas valide." })
  @IsNotEmpty({ message: "L'adresse email est requise." })
  email: string;

  @ApiProperty({
    example: 'MotDePasseSecurise123!',
    description: 'Mot de passe associé au compte',
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  password: string;
}
