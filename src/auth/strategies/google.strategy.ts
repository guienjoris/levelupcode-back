import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { AuthProvider } from '@prisma/client';

export interface OAuthUser {
  email: string;
  name?: string;
  avatarUrl?: string;
  provider: AuthProvider;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID:
        configService.get<string>('GOOGLE_CLIENT_ID') ||
        'placeholder-google-client-id',
      clientSecret:
        configService.get<string>('GOOGLE_CLIENT_SECRET') ||
        'placeholder-google-client-secret',
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL') ||
        'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { emails, displayName, photos } = profile;
    const user: OAuthUser = {
      email: emails && emails[0] ? emails[0].value : '',
      name: displayName || undefined,
      avatarUrl: photos && photos[0] ? photos[0].value : undefined,
      provider: AuthProvider.GOOGLE,
    };
    done(null, user);
  }
}
