import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class PublicShareRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findByToken(publicToken: string) {
    return this.prisma.project.findUnique({
      where: { publicToken },
      include: {
        columns: { orderBy: { orderIndex: 'asc' } },
        tasks: { orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }] },
        milestones: { orderBy: [{ date: 'asc' }, { createdAt: 'asc' }] },
        nonWorkingDays: { orderBy: [{ date: 'asc' }, { createdAt: 'asc' }] },
        stickers: { orderBy: [{ zIndex: 'asc' }, { createdAt: 'asc' }] },
      },
    });
  }
}
