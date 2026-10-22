import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { OAuthUser } from './strategies/google.strategy.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Inscription d’un nouvel apprenant',
    description:
      'Crée un nouveau compte, initialise son streak quotidien et retourne les jetons JWT.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Compte créé avec succès',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Adresse email déjà utilisée',
  })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Connexion locale (email / mot de passe)',
    description:
      'Authentifie l’utilisateur et retourne une paire de jetons (access + refresh token).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connexion réussie',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Identifiants incorrects',
  })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rafraîchissement du token d’accès',
    description:
      'Génère un nouvel access token à partir d’un refresh token valide.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Nouveau token d’accès généré',
    schema: {
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Refresh token invalide ou expiré',
  })
  async refresh(
    @Body() dto: RefreshTokenDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Profil de l’utilisateur connecté',
    description:
      'Retourne les informations du compte actuellement authentifié (rôle, streak, etc.).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profil utilisateur',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Accès non autorisé',
  })
  async getMe(@CurrentUser('id') userId: string): Promise<UserProfileDto> {
    return this.authService.getMe(userId);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Redirection vers Google OAuth2' })
  googleAuth(): void {
    // Déclenché par le guard passport-google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback Google OAuth2' })
  async googleAuthRedirect(
    @Req() req: { user: OAuthUser },
  ): Promise<AuthResponseDto> {
    return this.authService.handleOAuthLogin(req.user);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Redirection vers GitHub OAuth2' })
  githubAuth(): void {
    // Déclenché par le guard passport-github2
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Callback GitHub OAuth2' })
  async githubAuthRedirect(
    @Req() req: { user: OAuthUser },
  ): Promise<AuthResponseDto> {
    return this.authService.handleOAuthLogin(req.user);
  }
}
