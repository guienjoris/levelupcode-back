import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CronSecretGuard } from './cron-secret.guard.js';

describe('CronSecretGuard', () => {
  let guard: CronSecretGuard;
  let configService: ConfigService;

  const mockConfigService = {
    get: vi.fn(),
  };

  const createMockContext = (
    headers: Record<string, string>,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'CRON_SECRET') return 'super-secret-cron-key';
      return null;
    });
    guard = new CronSecretGuard(mockConfigService as any);
  });

  it('devrait autoriser la requête avec le header x-cron-secret valide', () => {
    const context = createMockContext({
      'x-cron-secret': 'super-secret-cron-key',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('devrait autoriser la requête avec le header authorization Bearer', () => {
    const context = createMockContext({
      authorization: 'Bearer super-secret-cron-key',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('devrait rejeter si le header est manquant', () => {
    const context = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('devrait rejeter si le secret est incorrect', () => {
    const context = createMockContext({
      'x-cron-secret': 'wrong-secret',
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('devrait rejeter si CRON_SECRET n’est pas configuré sur le serveur', () => {
    mockConfigService.get.mockReturnValue(null);
    const context = createMockContext({
      'x-cron-secret': 'super-secret-cron-key',
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
