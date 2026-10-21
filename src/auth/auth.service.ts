import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { AuthProvider, Role, User, UserStreak } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto.js';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';
import { OAuthUser } from './strategies/google.strategy.js';

type UserWithStreak = User & { streak: UserStreak | null };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Un compte existe déjà avec cette adresse email.');
    }

    const passwordHash = await argon2.hash(dto.password);

    // Vérifier si des dons Buy Me a Coffee antérieurs avaient été effectués avec cette adresse email
    const priorDonations = await this.prisma.donation.findMany({
      where: { supporterEmail: email, userId: null },
      orderBy: { createdAt: 'asc' },
    });
    const hasPriorDonations = priorDonations.length > 0;

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name?.trim() || null,
        provider: AuthProvider.LOCAL,
        role: Role.USER,
        isSupporter: hasPriorDonations,
        supporterSince: hasPriorDonations ? priorDonations[0].createdAt : null,
        streak: {
          create: {
            currentStreak: 0,
            longestStreak: 0,
          },
        },
      },
      include: {
        streak: true,
      },
    });

    if (hasPriorDonations) {
      await this.prisma.donation.updateMany({
        where: { supporterEmail: email },
        data: { userId: user.id },
      });
      this.logger.log(`Dons antérieurs rattachés au compte ${user.email} (Statut Supporter accordé)`);
    }

    this.logger.log(`Nouvel utilisateur inscrit avec succès : ${user.email} (${user.id})`);
    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { streak: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Identifiants de connexion invalides.');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants de connexion invalides.');
    }

    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const refreshSecret = this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'super-secret-refresh-key',
      );

      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        throw new UnauthorizedException('Session utilisateur introuvable.');
      }

      const accessToken = await this.generateAccessToken(user);
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Jeton de rafraîchissement invalide ou expiré.');
    }
  }

  async getMe(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { streak: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return this.mapUserProfile(user);
  }

  async handleOAuthLogin(oAuthUser: OAuthUser): Promise<AuthResponseDto> {
    const email = oAuthUser.email.toLowerCase().trim();

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { streak: true },
    });

    if (!user) {
      const priorDonations = await this.prisma.donation.findMany({
        where: { supporterEmail: email, userId: null },
        orderBy: { createdAt: 'asc' },
      });
      const hasPriorDonations = priorDonations.length > 0;

      user = await this.prisma.user.create({
        data: {
          email,
          name: oAuthUser.name || null,
          avatarUrl: oAuthUser.avatarUrl || null,
          provider: oAuthUser.provider,
          role: Role.USER,
          isSupporter: hasPriorDonations,
          supporterSince: hasPriorDonations ? priorDonations[0].createdAt : null,
          streak: {
            create: {
              currentStreak: 0,
              longestStreak: 0,
            },
          },
        },
        include: { streak: true },
      });

      if (hasPriorDonations) {
        await this.prisma.donation.updateMany({
          where: { supporterEmail: email },
          data: { userId: user.id },
        });
      }

      this.logger.log(`Nouvel utilisateur OAuth créé : ${user.email} (${oAuthUser.provider})`);
    } else if (oAuthUser.avatarUrl && !user.avatarUrl) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: oAuthUser.avatarUrl },
        include: { streak: true },
      });
    }

    return this.generateTokens(user);
  }

  private async generateTokens(user: UserWithStreak): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET', 'super-secret-jwt-key');
    const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m') as any;

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'super-secret-refresh-key',
    );
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: jwtExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: this.mapUserProfile(user),
    };
  }

  private async generateAccessToken(user: { id: string; email: string; role: Role }): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET', 'super-secret-jwt-key');
    const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m') as any;

    return this.jwtService.signAsync(payload, {
      secret: jwtSecret,
      expiresIn: jwtExpiresIn,
    });
  }

  private mapUserProfile(user: UserWithStreak): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isSupporter: user.isSupporter,
      currentStreak: user.streak?.currentStreak ?? 0,
      longestStreak: user.streak?.longestStreak ?? 0,
    };
  }
}
