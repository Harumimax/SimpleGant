import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import type { TaskColor, TaskStatus } from './task.constants.js';

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

  listCustomColumns(projectId: string) {
    return this.prisma.projectColumn.findMany({
      where: { projectId, isDefault: false },
      select: { key: true },
    });
  }

  listNonWorkingDates(projectId: string) {
    return this.prisma.nonWorkingDay.findMany({
      where: { projectId },
      select: { date: true },
      orderBy: { date: 'asc' },
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
    color: TaskColor;
    customFields: Record<string, string>;
  }) {
    return this.prisma.task.create({ data: input });
  }

  async updateWithParentDates(
    projectId: string,
    id: string,
    input: {
      title: string;
      workType: string | null;
      assignee: string;
      estimate: string | null;
      status: TaskStatus;
      color: string;
      startDate: Date | null;
      endDate: Date | null;
      isCollapsed: boolean;
      customFields: Record<string, string>;
    },
    parentDates: Array<{
      id: string;
      startDate: Date | null;
      endDate: Date | null;
    }>,
  ) {
    await this.prisma.$transaction([
      this.prisma.task.update({ where: { id }, data: input }),
      ...parentDates
        .filter((parent) => parent.id !== id)
        .map(({ id: parentId, ...dates }) =>
          this.prisma.task.update({ where: { id: parentId }, data: dates }),
        ),
    ]);
    return this.list(projectId);
  }

  async updateOrder(
    projectId: string,
    positions: Array<{
      id: string;
      parentId: string | null;
      orderIndex: number;
      level: number;
      startDate: Date | null;
      endDate: Date | null;
    }>,
  ) {
    await this.prisma.$transaction(
      positions.map(({ id, ...data }) =>
        this.prisma.task.update({ where: { id }, data }),
      ),
    );
    return this.list(projectId);
  }

  async deleteMany(
    projectId: string,
    taskIds: string[],
    parentDates: Array<{
      id: string;
      startDate: Date | null;
      endDate: Date | null;
    }> = [],
  ) {
    const [result] = await this.prisma.$transaction([
      this.prisma.task.deleteMany({
        where: { id: { in: taskIds }, projectId },
      }),
      ...parentDates.map(({ id, ...dates }) =>
        this.prisma.task.update({ where: { id }, data: dates }),
      ),
    ]);
    return result.count;
  }
}
