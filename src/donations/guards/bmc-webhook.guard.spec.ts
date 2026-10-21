import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { BmcWebhookGuard } from './bmc-webhook.guard.js';

describe('BmcWebhookGuard', () => {
  let guard: BmcWebhookGuard;
  const secretKey = 'my-super-bmc-secret';

  const mockConfigService = {
    get: vi.fn(),
  };

  const createMockContext = (
    headers: Record<string, string> = {},
    query: Record<string, string> = {},
    body: any = {},
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers, query, body }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'BMC_WEBHOOK_SECRET') return secretKey;
      return null;
    });
    guard = new BmcWebhookGuard(mockConfigService as any);
  });

  it('devrait autoriser la requête avec le header x-bmc-secret direct', () => {
    const context = createMockContext({ 'x-bmc-secret': secretKey });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('devrait autoriser la requête avec un en-tête Authorization Bearer', () => {
    const context = createMockContext({ authorization: `Bearer ${secretKey}` });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('devrait autoriser la requête avec un paramètre d’URL secret', () => {
    const context = createMockContext({}, { secret: secretKey });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('devrait autoriser la requête avec une signature HMAC-SHA256 valide', () => {
    const body = { type: 'donation', amount: 5 };
    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(JSON.stringify(body))
      .digest('hex');

    const context = createMockContext({ 'x-bmc-signature': hmac }, {}, body);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('devrait rejeter si la signature HMAC-SHA256 est erronée', () => {
    const body = { type: 'donation', amount: 5 };
    const context = createMockContext(
      { 'x-bmc-signature': 'deadbeef0123456789' },
      {},
      body,
    );
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('devrait rejeter si aucun secret ni signature n’est fourni', () => {
    const context = createMockContext({}, {}, {});
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('devrait rejeter si BMC_WEBHOOK_SECRET n’est pas configuré sur le serveur', () => {
    mockConfigService.get.mockReturnValue(null);
    const context = createMockContext({ 'x-bmc-secret': secretKey });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
