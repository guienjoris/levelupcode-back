import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: any): ExecutionContext => {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('devrait autoriser l’accès si aucun rôle n’est requis', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = createMockContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('devrait autoriser l’accès si l’utilisateur possède le rôle requis', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext({ id: '1', email: 'admin@test.com', role: Role.ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('devrait refuser l’accès si l’utilisateur a un rôle insuffisant', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext({ id: '2', email: 'user@test.com', role: Role.USER });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('devrait refuser l’accès si aucun utilisateur n’est présent sur la requête', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
