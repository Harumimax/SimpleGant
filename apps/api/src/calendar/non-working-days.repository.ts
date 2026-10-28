import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class NonWorkingDaysRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findOwnedProject(projectId: string, ownerId: string) {
    return this.prisma.project.findFirst({
      where: { id: projectId, ownerId },
      select: { id: true, startDate: true, endDate: true },
    });
  }

  list(projectId: string) {
    return this.prisma.nonWorkingDay.findMany({
      where: { projectId },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
  }

  find(projectId: string, id: string) {
    return this.prisma.nonWorkingDay.findFirst({
      where: { id, projectId },
    });
  }

  findByDate(projectId: string, date: Date) {
    return this.prisma.nonWorkingDay.findUnique({
      where: { projectId_date: { projectId, date } },
    });
  }

  create(input: { projectId: string; date: Date; label?: string }) {
    return this.prisma.nonWorkingDay.create({ data: input });
  }

  async delete(projectId: string, id: string) {
    const result = await this.prisma.nonWorkingDay.deleteMany({
      where: { id, projectId },
    });
    return result.count;
  }
}
