import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import type { MilestoneColor } from './milestone.constants.js';

@Injectable()
export class MilestonesRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findOwnedProject(projectId: string, ownerId: string) {
    return this.prisma.project.findFirst({
      where: { id: projectId, ownerId },
      select: { id: true, startDate: true, endDate: true },
    });
  }

  list(projectId: string) {
    return this.prisma.milestone.findMany({
      where: { projectId },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
  }

  find(projectId: string, milestoneId: string) {
    return this.prisma.milestone.findFirst({
      where: { id: milestoneId, projectId },
    });
  }

  create(input: {
    projectId: string;
    title: string;
    date: Date;
    color: MilestoneColor;
  }) {
    return this.prisma.milestone.create({ data: input });
  }

  update(
    id: string,
    input: { title: string; date: Date; color: MilestoneColor },
  ) {
    return this.prisma.milestone.update({ where: { id }, data: input });
  }

  async delete(projectId: string, milestoneId: string) {
    const result = await this.prisma.milestone.deleteMany({
      where: { id: milestoneId, projectId },
    });
    return result.count;
  }
}
