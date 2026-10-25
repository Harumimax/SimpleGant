import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';

import { Prisma } from '../generated/prisma/client.js';
import { AuthRepository } from './auth.repository.js';
import { SESSION_DURATION_MS } from './auth.constants.js';
import type { AuthResult, PublicUser } from './auth.types.js';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @Inject(AuthRepository) private readonly repository: AuthRepository,
  ) {}

  async register(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.repository.findUserByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    this.assertPasswordByteLength(password);

    const passwordHash = await hash(password, BCRYPT_ROUNDS);
    const session = this.createSessionData();
    let user;

    try {
      user = await this.repository.createUserWithSession({
        email: normalizedEmail,
        passwordHash,
        tokenHash: session.tokenHash,
        expiresAt: session.expiresAt,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }

      throw error;
    }

    return {
      token: session.token,
      user: this.toPublicUser(user),
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.repository.findUserByEmail(
      email.trim().toLowerCase(),
    );

    if (!user || !(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const session = this.createSessionData();
    await this.repository.createSession(
      user.id,
      session.tokenHash,
      session.expiresAt,
    );

    return {
      token: session.token,
      user: this.toPublicUser(user),
    };
  }

  async getCurrentUser(token?: string): Promise<PublicUser> {
    if (!token) {
      throw new UnauthorizedException('Требуется авторизация');
    }

    const session = await this.repository.findUserBySession(
      this.hashToken(token),
      new Date(),
    );

    if (!session) {
      throw new UnauthorizedException('Сессия недействительна');
    }

    return this.toPublicUser(session.user);
  }

  async logout(token?: string) {
    if (token) {
      await this.repository.deleteSession(this.hashToken(token));
    }
  }

  private createSessionData() {
    const token = randomBytes(32).toString('base64url');

    return {
      token,
      tokenHash: this.hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private assertPasswordByteLength(password: string) {
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new BadRequestException('Пароль должен занимать не более 72 байт');
    }
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    createdAt: Date;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
