import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CronSecretGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const cronSecretHeader =
      request.headers['x-cron-secret'] || request.headers['authorization'];

    const expectedSecret = this.configService.get<string>('CRON_SECRET');

    if (!expectedSecret) {
      throw new UnauthorizedException('CRON_SECRET non configuré sur le serveur.');
    }

    if (!cronSecretHeader) {
      throw new UnauthorizedException('En-tête de secret manquant (x-cron-secret requis).');
    }

    // Accepte soit la valeur brute, soit le format Bearer <secret>
    const providedSecret = cronSecretHeader.startsWith('Bearer ')
      ? cronSecretHeader.slice(7).trim()
      : cronSecretHeader.trim();

    if (providedSecret !== expectedSecret) {
      throw new UnauthorizedException('Secret de déclenchement Cloud Scheduler invalide.');
    }

    return true;
  }
}
