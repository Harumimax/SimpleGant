import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';

export const DEFAULT_PROJECT_COLUMNS = [
  { name: 'Название', key: 'title', orderIndex: 0 },
  { name: 'Тип работ', key: 'workType', orderIndex: 1 },
  { name: 'Исполнитель', key: 'assignee', orderIndex: 2 },
  { name: 'Длительность', key: 'duration', orderIndex: 3 },
  { name: 'Статус', key: 'status', orderIndex: 4 },
] as const;

@Injectable()
export class ProjectsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  listByOwner(ownerId: string) {
    return this.prisma.project.findMany({
      where: { ownerId },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findOwned(id: string, ownerId: string) {
    return this.prisma.project.findFirst({
      where: { id, ownerId },
      include: { columns: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  create(input: {
    ownerId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    excludeNonWorkingDays: boolean;
    publicToken: string;
  }) {
    return this.prisma.project.create({
      data: {
        ...input,
        columns: {
          create: DEFAULT_PROJECT_COLUMNS.map((column) => ({
            ...column,
            isDefault: true,
            isVisible: true,
          })),
        },
      },
      include: { columns: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  update(
    id: string,
    data: { name: string; startDate: Date; endDate: Date },
  ) {
    return this.prisma.project.update({
      where: { id },
      data,
      include: { columns: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  countMilestonesOutsideRange(id: string, startDate: Date, endDate: Date) {
    return this.prisma.milestone.count({
      where: {
        projectId: id,
        OR: [{ date: { lt: startDate } }, { date: { gt: endDate } }],
      },
    });
  }

  countNonWorkingDaysOutsideRange(id: string, startDate: Date, endDate: Date) {
    return this.prisma.nonWorkingDay.count({
      where: {
        projectId: id,
        OR: [{ date: { lt: startDate } }, { date: { gt: endDate } }],
      },
    });
  }

  async deleteOwned(id: string, ownerId: string) {
    const result = await this.prisma.project.deleteMany({
      where: { id, ownerId },
    });
    return result.count > 0;
  }
}
