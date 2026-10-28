import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { isTaskColor, isTaskWorkType, TASK_STATUSES } from '../tasks/task.constants.js';
import { calculateDuration, dateOnly, parseDateOnly, validateDateRange } from '../tasks/task-dates.js';
import { recalculateParentDates } from '../tasks/parent-task-dates.js';
import type { UpdateGanttDto } from './gantt.dto.js';
import { GanttRepository } from './gantt.repository.js';

@Injectable()
export class GanttService {
  constructor(
    @Inject(GanttRepository) private readonly repository: GanttRepository,
  ) {}

  async get(projectId: string, ownerId: string) {
    const aggregate = await this.repository.findOwned(projectId, ownerId);
    if (!aggregate) throw new NotFoundException('Проект не найден');
    return this.toView(aggregate);
  }

  async update(projectId: string, ownerId: string, input: UpdateGanttDto) {
    const current = await this.repository.findOwned(projectId, ownerId);
    if (!current) throw new NotFoundException('Проект не найден');

    this.ensureUniqueIds(input.columns, 'Колонки не должны повторяться');
    this.ensureUniqueIds(input.tasks, 'Задачи не должны повторяться');
    this.ensureUniqueIds(input.milestones, 'Вехи не должны повторяться');
    this.ensureUniqueIds(input.nonWorkingDays, 'Нерабочие дни не должны повторяться');
    if (await this.repository.findConflictingIds(projectId, {
      columnIds: input.columns.map(({ id }) => id),
      taskIds: input.tasks.map(({ id }) => id),
      milestoneIds: input.milestones.map(({ id }) => id),
      nonWorkingDayIds: input.nonWorkingDays.map(({ id }) => id),
    })) {
      throw new BadRequestException('Один из объектов принадлежит другому проекту');
    }

    const now = new Date();
    const currentColumns = new Map(current.columns.map((column) => [column.id, column]));
    const submittedColumnIds = new Set(input.columns.map(({ id }) => id));
    if (current.columns.some((column) => column.isDefault && !submittedColumnIds.has(column.id))) {
      throw new BadRequestException('Системные колонки нельзя удалить');
    }
    const columnNames = input.columns.map(({ name }) => name.toLocaleLowerCase('ru'));
    if (new Set(columnNames).size !== columnNames.length) {
      throw new BadRequestException('Названия колонок не должны повторяться');
    }
    const columns = input.columns.map((column, orderIndex) => {
      const existing = currentColumns.get(column.id);
      return {
        id: column.id,
        name: column.name,
        key: existing?.key ?? `custom_${column.id.replaceAll('-', '')}`,
        orderIndex,
        isVisible: column.isVisible,
        isDefault: existing?.isDefault ?? false,
        createdAt: existing?.createdAt ?? now,
      };
    });
    const customColumnKeys = new Set(
      columns.filter(({ isDefault }) => !isDefault).map(({ key }) => key),
    );

    const currentTasks = new Map(current.tasks.map((task) => [task.id, task]));
    const taskIds = new Set(input.tasks.map(({ id }) => id));
    for (const task of input.tasks) {
      if (task.parentId === task.id) {
        throw new BadRequestException('Задача не может быть родителем самой себе');
      }
      if (task.parentId && !taskIds.has(task.parentId)) {
        throw new BadRequestException('Родительская задача не принадлежит проекту');
      }
      const existing = currentTasks.get(task.id);
      if (task.workType && task.workType !== existing?.workType && !isTaskWorkType(task.workType)) {
        throw new BadRequestException('Выберите допустимый тип работ');
      }
      if (!TASK_STATUSES.includes(task.status as (typeof TASK_STATUSES)[number])) {
        throw new BadRequestException('Выберите допустимый статус задачи');
      }
      if (!isTaskColor(task.color)) {
        throw new BadRequestException('Выберите допустимый цвет задачи');
      }
      if (task.comment && task.comment.trim().length > 1000) {
        throw new BadRequestException(
          'Комментарий должен быть не длиннее 1000 символов',
        );
      }
      for (const [key, value] of Object.entries(task.customFields)) {
        if (!customColumnKeys.has(key)) {
          throw new BadRequestException('Поле задачи не принадлежит проекту');
        }
        if (typeof value !== 'string' || value.trim().length > 500) {
          throw new BadRequestException('Пользовательское поле должно быть текстом до 500 символов');
        }
      }
    }
    const orderIndexes = this.resolveSiblingOrder(input.tasks);
    const levels = this.resolveLevels(input.tasks);
    const tasks = recalculateParentDates(input.tasks.map((task) => {
      const startDate = task.startDate ? parseDateOnly(task.startDate) : null;
      const endDate = task.endDate ? parseDateOnly(task.endDate) : null;
      validateDateRange(startDate, endDate);
      return {
        ...task,
        orderIndex: orderIndexes.get(task.id) ?? 0,
        level: levels.get(task.id) ?? 0,
        startDate,
        endDate,
        comment: task.comment?.trim() || null,
        customFields: Object.fromEntries(
          Object.entries(task.customFields)
            .map(([key, value]) => [key, String(value).trim()])
            .filter(([, value]) => value),
        ),
        createdAt: currentTasks.get(task.id)?.createdAt ?? now,
      };
    }));

    const currentMilestones = new Map(current.milestones.map((item) => [item.id, item]));
    const milestones = input.milestones.map((milestone) => {
      const date = parseDateOnly(milestone.date);
      this.validateProjectDate(date, current.startDate, current.endDate, 'Дата вехи');
      return {
        ...milestone,
        date,
        createdAt: currentMilestones.get(milestone.id)?.createdAt ?? now,
      };
    });

    const currentDays = new Map(current.nonWorkingDays.map((item) => [item.id, item]));
    const dayDates = new Set<string>();
    const nonWorkingDays = input.nonWorkingDays.map((day) => {
      if (dayDates.has(day.date)) {
        throw new BadRequestException('Нерабочие даты не должны повторяться');
      }
      dayDates.add(day.date);
      const date = parseDateOnly(day.date);
      this.validateProjectDate(date, current.startDate, current.endDate, 'Нерабочий день');
      return {
        ...day,
        date,
        label: day.label ?? null,
        createdAt: currentDays.get(day.id)?.createdAt ?? now,
      };
    });

    const saved = await this.repository.replace(projectId, {
      columns,
      tasks,
      milestones,
      nonWorkingDays,
    });
    if (!saved) throw new NotFoundException('Проект не найден');
    return this.toView(saved);
  }

  private ensureUniqueIds(items: Array<{ id: string }>, message: string) {
    if (new Set(items.map(({ id }) => id)).size !== items.length) {
      throw new BadRequestException(message);
    }
  }

  private resolveSiblingOrder(
    tasks: Array<{ id: string; parentId: string | null; orderIndex: number }>,
  ) {
    const groups = new Map<string, Array<{
      id: string;
      inputIndex: number;
      orderIndex: number;
    }>>();
    tasks.forEach((task, inputIndex) => {
      const key = task.parentId ?? 'root';
      groups.set(key, [...(groups.get(key) ?? []), { ...task, inputIndex }]);
    });
    const result = new Map<string, number>();
    for (const siblings of groups.values()) {
      siblings
        .sort((left, right) =>
          left.orderIndex - right.orderIndex || left.inputIndex - right.inputIndex,
        )
        .forEach(({ id }, index) => result.set(id, index));
    }
    return result;
  }

  private resolveLevels(tasks: Array<{ id: string; parentId: string | null }>) {
    const positions = new Map(tasks.map((task) => [task.id, task]));
    const levels = new Map<string, number>();
    const visiting = new Set<string>();
    const resolve = (id: string): number => {
      const known = levels.get(id);
      if (known !== undefined) return known;
      if (visiting.has(id)) throw new BadRequestException('Обнаружена циклическая вложенность задач');
      visiting.add(id);
      const parentId = positions.get(id)?.parentId;
      const level = parentId ? resolve(parentId) + 1 : 0;
      visiting.delete(id);
      if (level >= 5) throw new BadRequestException('Допустимо не более пяти уровней задач');
      levels.set(id, level);
      return level;
    };
    for (const id of positions.keys()) resolve(id);
    return levels;
  }

  private validateProjectDate(date: Date, start: Date, end: Date, label: string) {
    if (date < start || date > end) {
      throw new BadRequestException(`${label} должен входить в период проекта`);
    }
  }

  private toView(aggregate: NonNullable<Awaited<ReturnType<GanttRepository['findOwned']>>>) {
    return {
      project: {
        id: aggregate.id,
        publicToken: aggregate.publicToken,
        name: aggregate.name,
        startDate: dateOnly(aggregate.startDate)!,
        endDate: dateOnly(aggregate.endDate)!,
        createdAt: aggregate.createdAt,
        updatedAt: aggregate.updatedAt,
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
        ...task,
        duration: calculateDuration(task.startDate, task.endDate),
        startDate: dateOnly(task.startDate),
        endDate: dateOnly(task.endDate),
        customFields: task.customFields as Record<string, string>,
      })),
      milestones: aggregate.milestones.map((milestone) => ({
        ...milestone,
        date: dateOnly(milestone.date)!,
      })),
      nonWorkingDays: aggregate.nonWorkingDays.map((day) => ({
        ...day,
        date: dateOnly(day.date)!,
      })),
    };
  }
}
