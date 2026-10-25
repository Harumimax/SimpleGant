import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfOriginGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    if (SAFE_METHODS.has(request.method)) {
      return true;
    }

    const allowedOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:5173';

    if (request.headers.origin !== allowedOrigin) {
      throw new ForbiddenException('Недопустимый источник запроса');
    }

    return true;
  }
}
