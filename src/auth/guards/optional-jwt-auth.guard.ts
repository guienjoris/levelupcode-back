import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: any): TUser {
    // Permet l'accès même sans token ou avec un token invalide.
    // Si l'utilisateur est connecté, req.user sera peuplé, sinon null.
    if (err || !user) {
      return null as TUser;
    }
    return user;
  }
}
