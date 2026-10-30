import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { AuthService } from './auth.service.js';
import { CredentialsDto } from './auth.dto.js';
import {
  isSessionCookieSecure,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from './auth.constants.js';
import { CurrentUser } from './current-user.decorator.js';
import { SessionGuard } from './session.guard.js';
import type { PublicUser } from './auth.types.js';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() credentials: CredentialsDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.register(
      credentials.email,
      credentials.password,
    );
    this.setSessionCookie(reply, result.token);

    return { user: result.user };
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Body() credentials: CredentialsDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.login(
      credentials.email,
      credentials.password,
    );
    this.setSessionCookie(reply, result.token);

    return { user: result.user };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  getCurrentUser(@CurrentUser() user: PublicUser) {
    return { user };
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(SessionGuard)
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    await this.authService.logout(request.cookies[SESSION_COOKIE_NAME]);
    reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  }

  private setSessionCookie(reply: FastifyReply, token: string) {
    reply.setCookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSessionCookieSecure(),
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    });
  }
}
