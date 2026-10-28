import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { calculateDuration, dateOnly } from '../tasks/task-dates.js';
import { PublicShareRepository } from './public-share.repository.js';

@Injectable()
export class PublicShareService {
  constructor(
    @Inject(PublicShareRepository)
    private readonly repository: PublicShareRepository,
  ) {}

  async get(publicToken: string) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(publicToken)) {
      throw new NotFoundException('Публичный проект не найден');
    }
    const aggregate = await this.repository.findByToken(publicToken);
    if (!aggregate) throw new NotFoundException('Публичный проект не найден');

    return {
      project: {
        id: aggregate.id,
        name: aggregate.name,
        startDate: dateOnly(aggregate.startDate)!,
        endDate: dateOnly(aggregate.endDate)!,
        columns: aggregate.columns.map((column) => ({
          id: column.id,
          name: column.name,
          key: column.key,
          orderIndex: column.orderIndex,
          isVisible: column.isVisible,
          isDefault: column.isDefault,
        })),
      },
      tasks: aggregate.tasks.map((task) => ({
        id: task.id,
        parentId: task.parentId,
        orderIndex: task.orderIndex,
        level: task.level,
        title: task.title,
        workType: task.workType,
        assignee: task.assignee,
        estimate: task.estimate,
        comment: task.comment,
        duration: calculateDuration(task.startDate, task.endDate),
        status: task.status,
        startDate: dateOnly(task.startDate),
        endDate: dateOnly(task.endDate),
        color: task.color,
        isCollapsed: task.isCollapsed,
        customFields: task.customFields as Record<string, string>,
      })),
      milestones: aggregate.milestones.map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        date: dateOnly(milestone.date)!,
        color: milestone.color,
      })),
      nonWorkingDays: aggregate.nonWorkingDays.map((day) => ({
        id: day.id,
        date: dateOnly(day.date)!,
        label: day.label,
      })),
    };
  }
}
