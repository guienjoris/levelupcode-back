import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { Role } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: vi.fn(),
    login: vi.fn(),
    refreshTokens: vi.fn(),
    getMe: vi.fn(),
    handleOAuthLogin: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  it('register devrait appeler authService.register', async () => {
    const dto = { email: 'test@example.com', password: 'Password123!' };
    mockAuthService.register.mockResolvedValue({
      accessToken: 'acc',
      refreshToken: 'ref',
      user: { id: '1', email: 'test@example.com', role: Role.USER },
    });

    const res = await controller.register(dto);
    expect(service.register).toHaveBeenCalledWith(dto);
    expect(res.accessToken).toBe('acc');
  });

  it('login devrait appeler authService.login', async () => {
    const dto = { email: 'test@example.com', password: 'Password123!' };
    mockAuthService.login.mockResolvedValue({
      accessToken: 'acc',
      refreshToken: 'ref',
      user: { id: '1', email: 'test@example.com', role: Role.USER },
    });

    const res = await controller.login(dto);
    expect(service.login).toHaveBeenCalledWith(dto);
    expect(res.accessToken).toBe('acc');
  });

  it('refresh devrait appeler authService.refreshTokens', async () => {
    mockAuthService.refreshTokens.mockResolvedValue({ accessToken: 'new-acc' });

    const res = await controller.refresh({ refreshToken: 'ref-token' });
    expect(service.refreshTokens).toHaveBeenCalledWith('ref-token');
    expect(res.accessToken).toBe('new-acc');
  });

  it('getMe devrait appeler authService.getMe avec l’id extrait du token', async () => {
    mockAuthService.getMe.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      role: Role.USER,
      isSupporter: false,
      currentStreak: 2,
      longestStreak: 5,
    });

    const res = await controller.getMe('user-1');
    expect(service.getMe).toHaveBeenCalledWith('user-1');
    expect(res.id).toBe('user-1');
  });
});
