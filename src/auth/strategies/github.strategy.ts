import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-github2';
import { AuthProvider } from '@prisma/client';
import { OAuthUser } from './google.strategy.js';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') || 'placeholder-github-client-id',
      clientSecret:
        configService.get<string>('GITHUB_CLIENT_SECRET') || 'placeholder-github-client-secret',
      callbackURL:
        configService.get<string>('GITHUB_CALLBACK_URL') ||
        'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: {
      emails?: Array<{ value: string }>;
      displayName?: string;
      username?: string;
      photos?: Array<{ value: string }>;
    },
    done: (err: any, user?: OAuthUser) => void,
  ): void {
    const email =
      profile.emails && profile.emails[0]
        ? profile.emails[0].value
        : `${profile.username || 'github-user'}@users.noreply.github.com`;

    const user: OAuthUser = {
      email,
      name: profile.displayName || profile.username,
      avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
      provider: AuthProvider.GITHUB,
    };
    done(null, user);
  }
}
