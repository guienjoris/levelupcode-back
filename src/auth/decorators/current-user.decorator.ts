import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserFromToken } from '../interfaces/jwt-payload.interface.js';

export const CurrentUser = createParamDecorator(
  (data: keyof UserFromToken | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserFromToken;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
