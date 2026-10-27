import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';

export type PersistedColumnInput = {
  id?: string;
  name: string;
  key: string;
  orderIndex: number;
  isVisible: boolean;
  isDefault: boolean;
};

@Injectable()
export class ProjectColumnsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findOwnedProject(projectId: string, ownerId: string) {
    return this.prisma.project.findFirst({
      where: { id: projectId, ownerId },
      select: {
        id: true,
        columns: { orderBy: { orderIndex: 'asc' } },
      },
    });
  }

  replace(
    projectId: string,
    columns: PersistedColumnInput[],
    removedCustomKeys: string[],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.projectColumn.updateMany({
        where: { projectId },
        data: { orderIndex: { increment: 100 } },
      });

      const retainedIds = columns.flatMap(({ id }) => id ? [id] : []);
      await transaction.projectColumn.deleteMany({
        where: {
          projectId,
          ...(retainedIds.length > 0 ? { id: { notIn: retainedIds } } : {}),
        },
      });

      if (removedCustomKeys.length > 0) {
        const tasks = await transaction.task.findMany({
          where: { projectId },
          select: { id: true, customFields: true },
        });
        for (const task of tasks) {
          if (
            !task.customFields ||
            typeof task.customFields !== 'object' ||
            Array.isArray(task.customFields)
          ) continue;
          const customFields = {
            ...(task.customFields as Record<string, unknown>),
          };
          let changed = false;
          for (const key of removedCustomKeys) {
            if (key in customFields) {
              delete customFields[key];
              changed = true;
            }
          }
          if (changed) {
            await transaction.task.update({
              where: { id: task.id },
              data: { customFields: customFields as Prisma.InputJsonValue },
            });
          }
        }
      }

      for (const column of columns) {
        const { id, ...data } = column;
        if (id) {
          await transaction.projectColumn.update({ where: { id }, data });
        } else {
          await transaction.projectColumn.create({
            data: { ...data, projectId },
          });
        }
      }

      return transaction.projectColumn.findMany({
        where: { projectId },
        orderBy: { orderIndex: 'asc' },
      });
    });
  }
}
