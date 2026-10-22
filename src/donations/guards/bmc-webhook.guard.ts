import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class BmcWebhookGuard implements CanActivate {
  private readonly logger = new Logger(BmcWebhookGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const expectedSecret = this.configService.get<string>('BMC_WEBHOOK_SECRET');

    if (!expectedSecret) {
      this.logger.error(
        "BMC_WEBHOOK_SECRET n'est pas configuré sur le serveur.",
      );
      throw new UnauthorizedException(
        'Configuration du webhook Buy Me a Coffee manquante sur le serveur.',
      );
    }

    const headers = request.headers;
    const rawSecretHeader =
      headers['x-bmc-secret'] ||
      headers['x-webhook-secret'] ||
      headers['authorization'];
    const signatureHeader =
      headers['x-bmc-signature'] ||
      headers['x-signature-sha256'] ||
      headers['x-webhook-signature'];
    const querySecret = request.query?.secret;

    // 1. Vérification par secret partagé (Header direct, Bearer token ou Query param)
    if (rawSecretHeader) {
      const token = rawSecretHeader.startsWith('Bearer ')
        ? rawSecretHeader.slice(7).trim()
        : rawSecretHeader.trim();
      if (token === expectedSecret) {
        return true;
      }
    }

    if (querySecret && querySecret === expectedSecret) {
      return true;
    }

    // 2. Vérification par signature cryptographique HMAC-SHA256
    if (signatureHeader && request.body) {
      try {
        const bodyString =
          typeof request.body === 'string'
            ? request.body
            : JSON.stringify(request.body);
        const computedSignature = crypto
          .createHmac('sha256', expectedSecret)
          .update(bodyString)
          .digest('hex');

        const signatureBuffer = Buffer.from(signatureHeader.trim(), 'hex');
        const computedBuffer = Buffer.from(computedSignature, 'hex');

        if (
          signatureBuffer.length === computedBuffer.length &&
          crypto.timingSafeEqual(signatureBuffer, computedBuffer)
        ) {
          return true;
        }
      } catch (err) {
        this.logger.warn(
          'Erreur lors du calcul de la signature HMAC BMC:',
          err,
        );
      }
    }

    throw new UnauthorizedException(
      'Signature ou secret Buy Me a Coffee manquant ou invalide.',
    );
  }
}
