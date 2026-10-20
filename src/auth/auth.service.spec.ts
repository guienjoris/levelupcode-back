import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role, AuthProvider } from '@prisma/client';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  const mockJwtService = {
    signAsync: vi.fn().mockResolvedValue('mock-token'),
    verifyAsync: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn().mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'JWT_SECRET') return 'test-jwt-secret';
      if (key === 'JWT_EXPIRES_IN') return '15m';
      if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('devrait inscrire un nouvel utilisateur et retourner les tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'test@example.com',
        name: 'Testeur',
        avatarUrl: null,
        provider: AuthProvider.LOCAL,
        role: Role.USER,
        isSupporter: false,
        streak: { currentStreak: 0, longestStreak: 0 },
      });

      const result = await service.register({
        email: 'TEST@example.com',
        password: 'ValidPassword123!',
        name: 'Testeur',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe(Role.USER);
    });

    it('devrait lever une ConflictException si l’email existe déjà', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.register({
          email: 'already@taken.com',
          password: 'ValidPassword123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('devrait authentifier avec succès sur mot de passe valide', async () => {
      const passwordHash = await argon2.hash('Secret123!');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        passwordHash,
        name: 'User',
        role: Role.USER,
        isSupporter: false,
        streak: { currentStreak: 2, longestStreak: 5 },
      });

      const result = await service.login({
        email: 'user@test.com',
        password: 'Secret123!',
      });

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.currentStreak).toBe(2);
    });

    it('devrait lever une UnauthorizedException si l’utilisateur n’existe pas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@test.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('devrait lever une UnauthorizedException si le mot de passe est faux', async () => {
      const passwordHash = await argon2.hash('RealPassword123!');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        passwordHash,
      });

      await expect(
        service.login({ email: 'user@test.com', password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('devrait générer un nouvel access token sur refresh token valide', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        email: 'user@test.com',
        role: Role.USER,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        role: Role.USER,
      });

      const result = await service.refreshTokens('valid-refresh-token');
      expect(result).toHaveProperty('accessToken');
    });

    it('devrait lever UnauthorizedException sur refresh token invalide', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getMe', () => {
    it('devrait retourner le profil complet de l’utilisateur', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        name: 'Alex',
        avatarUrl: 'https://avatar.png',
        role: Role.USER,
        isSupporter: true,
        streak: { currentStreak: 3, longestStreak: 10 },
      });

      const profile = await service.getMe('user-1');
      expect(profile.id).toBe('user-1');
      expect(profile.isSupporter).toBe(true);
      expect(profile.currentStreak).toBe(3);
    });

    it('devrait lever une NotFoundException si l’utilisateur est introuvable', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe('unknown-id')).rejects.toThrow(NotFoundException);
    });
  });
});
