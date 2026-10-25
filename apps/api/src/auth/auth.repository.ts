import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';

type CreateUserWithSessionInput = {
  email: string;
  passwordHash: string;
  tokenHash: string;
  expiresAt: Date;
};

@Injectable()
export class AuthRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  createUserWithSession(input: CreateUserWithSessionInput) {
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          email: input.email,
          passwordHash: input.passwordHash,
        },
      });

      await transaction.session.create({
        data: {
          userId: user.id,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
        },
      });

      return user;
    });
  }

  async createSession(userId: string, tokenHash: string, expiresAt: Date) {
    await this.prisma.session.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  findUserBySession(tokenHash: string, now: Date) {
    return this.prisma.session.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: now },
      },
      include: { user: true },
    });
  }

  async deleteSession(tokenHash: string) {
    await this.prisma.session.deleteMany({ where: { tokenHash } });
  }
}
