import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import { AuthService } from './auth.service.js';
import { SESSION_COOKIE_NAME } from './auth.constants.js';
import type { PublicUser } from './auth.types.js';

export type AuthenticatedRequest = FastifyRequest & {
  user: PublicUser;
};

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.user = await this.authService.getCurrentUser(
      request.cookies[SESSION_COOKIE_NAME],
    );

    return true;
  }
}
