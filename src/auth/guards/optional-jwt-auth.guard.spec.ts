import { describe, it, expect } from 'vitest';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard.js';

describe('OptionalJwtAuthGuard', () => {
  const guard = new OptionalJwtAuthGuard();

  it('devrait retourner le user s’il est présent', () => {
    const mockUser = { id: 'u-1', email: 'test@example.com' };
    const result = guard.handleRequest(null, mockUser);
    expect(result).toEqual(mockUser);
  });

  it('devrait retourner null au lieu de jeter une exception si user est absent', () => {
    const result = guard.handleRequest(null, null);
    expect(result).toBeNull();
  });

  it('devrait retourner null au lieu de jeter une exception en cas d’erreur JWT', () => {
    const result = guard.handleRequest(new Error('jwt expired'), null);
    expect(result).toBeNull();
  });
});
