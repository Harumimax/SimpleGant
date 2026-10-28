import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';

export type GanttPersistenceInput = {
  columns: Array<{
    id: string;
    name: string;
    key: string;
    orderIndex: number;
    isVisible: boolean;
    isDefault: boolean;
    createdAt: Date;
  }>;
  tasks: Array<{
    id: string;
    parentId: string | null;
    orderIndex: number;
    level: number;
    title: string;
    workType: string | null;
    assignee: string;
    estimate: string | null;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    color: string;
    isCollapsed: boolean;
    customFields: Record<string, string>;
    createdAt: Date;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    date: Date;
    color: string;
    createdAt: Date;
  }>;
  nonWorkingDays: Array<{
    id: string;
    date: Date;
    label: string | null;
    createdAt: Date;
  }>;
};

@Injectable()
export class GanttRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findOwned(projectId: string, ownerId: string) {
    return this.prisma.project.findFirst({
      where: { id: projectId, ownerId },
      include: {
        columns: { orderBy: { orderIndex: 'asc' } },
        tasks: { orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }] },
        milestones: { orderBy: [{ date: 'asc' }, { createdAt: 'asc' }] },
        nonWorkingDays: { orderBy: [{ date: 'asc' }, { createdAt: 'asc' }] },
      },
    });
  }

  async findConflictingIds(
    projectId: string,
    input: {
      columnIds: string[];
      taskIds: string[];
      milestoneIds: string[];
      nonWorkingDayIds: string[];
    },
  ) {
    const [columns, tasks, milestones, nonWorkingDays] = await Promise.all([
      this.prisma.projectColumn.count({
        where: { id: { in: input.columnIds }, projectId: { not: projectId } },
      }),
      this.prisma.task.count({
        where: { id: { in: input.taskIds }, projectId: { not: projectId } },
      }),
      this.prisma.milestone.count({
        where: { id: { in: input.milestoneIds }, projectId: { not: projectId } },
      }),
      this.prisma.nonWorkingDay.count({
        where: {
          id: { in: input.nonWorkingDayIds },
          projectId: { not: projectId },
        },
      }),
    ]);
    return columns + tasks + milestones + nonWorkingDays;
  }

  async replace(projectId: string, input: GanttPersistenceInput) {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.task.deleteMany({ where: { projectId } });
      await transaction.projectColumn.deleteMany({ where: { projectId } });
      await transaction.milestone.deleteMany({ where: { projectId } });
      await transaction.nonWorkingDay.deleteMany({ where: { projectId } });

      await transaction.projectColumn.createMany({
        data: input.columns.map((column) => ({ ...column, projectId })),
      });
      await transaction.task.createMany({
        data: input.tasks.map((task) => ({
          id: task.id,
          projectId,
          parentId: null,
          orderIndex: task.orderIndex,
          level: task.level,
          title: task.title,
          workType: task.workType,
          assignee: task.assignee,
          estimate: task.estimate,
          status: task.status,
          startDate: task.startDate,
          endDate: task.endDate,
          color: task.color,
          isCollapsed: task.isCollapsed,
          customFields: task.customFields as Prisma.InputJsonValue,
          createdAt: task.createdAt,
        })),
      });
      for (const task of input.tasks) {
        if (task.parentId) {
          await transaction.task.update({
            where: { id: task.id },
            data: { parentId: task.parentId },
          });
        }
      }
      await transaction.milestone.createMany({
        data: input.milestones.map((milestone) => ({ ...milestone, projectId })),
      });
      await transaction.nonWorkingDay.createMany({
        data: input.nonWorkingDays.map((day) => ({ ...day, projectId })),
      });
      await transaction.project.update({
        where: { id: projectId },
        data: { updatedAt: new Date() },
      });
    });

    return this.findOwned(projectId, (await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: { ownerId: true },
    })).ownerId);
  }
}
