import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import type { TaskStatus } from './task.constants.js';

@Injectable()
export class TasksRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findOwnedProject(projectId: string, ownerId: string) {
    return this.prisma.project.findFirst({
      where: { id: projectId, ownerId },
      select: { id: true },
    });
  }

  list(projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
    });
  }

  find(projectId: string, taskId: string) {
    return this.prisma.task.findFirst({
      where: { id: taskId, projectId },
    });
  }

  async nextOrderIndex(projectId: string) {
    const result = await this.prisma.task.aggregate({
      where: { projectId },
      _max: { orderIndex: true },
    });
    return (result._max.orderIndex ?? -1) + 1;
  }

  create(input: {
    projectId: string;
    orderIndex: number;
    title: string;
    workType?: string;
    assignee: string;
    estimate?: string;
    status: TaskStatus;
    startDate: Date | null;
    endDate: Date | null;
    color: string;
  }) {
    return this.prisma.task.create({ data: input });
  }

  update(
    id: string,
    input: {
      title: string;
      workType: string | null;
      assignee: string;
      estimate: string | null;
      status: TaskStatus;
      startDate: Date | null;
      endDate: Date | null;
      isCollapsed: boolean;
    },
  ) {
    return this.prisma.task.update({ where: { id }, data: input });
  }

  async updateOrder(
    projectId: string,
    positions: Array<{
      id: string;
      parentId: string | null;
      orderIndex: number;
      level: number;
    }>,
  ) {
    await this.prisma.$transaction(
      positions.map(({ id, ...data }) =>
        this.prisma.task.update({ where: { id }, data }),
      ),
    );
    return this.list(projectId);
  }

  async deleteMany(projectId: string, taskIds: string[]) {
    const result = await this.prisma.task.deleteMany({
      where: { id: { in: taskIds }, projectId },
    });
    return result.count;
  }
}
