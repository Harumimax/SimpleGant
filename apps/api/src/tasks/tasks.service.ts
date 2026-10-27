import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CreateTaskDto,
  ReorderTasksDto,
  UpdateTaskDto,
} from './tasks.dto.js';
import {
  DEFAULT_TASK_COLOR,
  TASK_STATUSES,
  type TaskStatus,
} from './task.constants.js';
import { dateOnly, normalizeCreationDates, parseDateOnly, validateDateRange } from './task-dates.js';
import { TasksRepository } from './tasks.repository.js';
import type { TaskView } from './task.types.js';

@Injectable()
export class TasksService {
  constructor(
    @Inject(TasksRepository) private readonly repository: TasksRepository,
  ) {}

  async list(projectId: string, ownerId: string): Promise<TaskView[]> {
    await this.ensureOwnedProject(projectId, ownerId);
    return (await this.repository.list(projectId)).map((task) => this.toView(task));
  }

  async get(projectId: string, taskId: string, ownerId: string): Promise<TaskView> {
    await this.ensureOwnedProject(projectId, ownerId);
    return this.toView(await this.findTask(projectId, taskId));
  }

  async create(
    projectId: string,
    ownerId: string,
    input: CreateTaskDto,
  ): Promise<TaskView> {
    await this.ensureOwnedProject(projectId, ownerId);
    const dates = normalizeCreationDates(
      input.startDate,
      input.endDate,
      input.excludeWeekends ?? true,
    );
    const task = await this.repository.create({
      projectId,
      orderIndex: await this.repository.nextOrderIndex(projectId),
      title: input.title,
      workType: input.workType,
      assignee: input.assignee,
      estimate: input.estimate,
      status: input.status ?? TASK_STATUSES[0],
      ...dates,
      color: DEFAULT_TASK_COLOR,
    });
    return this.toView(task);
  }

  async update(
    projectId: string,
    taskId: string,
    ownerId: string,
    input: UpdateTaskDto,
  ): Promise<TaskView> {
    await this.ensureOwnedProject(projectId, ownerId);
    const current = await this.findTask(projectId, taskId);
    const startDate = input.startDate === undefined
      ? current.startDate
      : input.startDate === null ? null : parseDateOnly(input.startDate);
    const endDate = input.endDate === undefined
      ? current.endDate
      : input.endDate === null ? null : parseDateOnly(input.endDate);
    validateDateRange(startDate, endDate);

    const task = await this.repository.update(taskId, {
      title: input.title ?? current.title,
      workType: input.workType === undefined ? current.workType : input.workType,
      assignee: input.assignee ?? current.assignee,
      estimate: input.estimate === undefined ? current.estimate : input.estimate,
      status: input.status ?? (current.status as TaskStatus),
      startDate,
      endDate,
      isCollapsed: input.isCollapsed ?? current.isCollapsed,
    });
    return this.toView(task);
  }

  async reorder(
    projectId: string,
    ownerId: string,
    input: ReorderTasksDto,
  ): Promise<TaskView[]> {
    await this.ensureOwnedProject(projectId, ownerId);
    const currentTasks = await this.repository.list(projectId);
    const currentIds = new Set(currentTasks.map(({ id }) => id));
    const submittedIds = new Set(input.tasks.map(({ id }) => id));

    if (
      input.tasks.length !== currentTasks.length ||
      submittedIds.size !== input.tasks.length ||
      input.tasks.some(({ id }) => !currentIds.has(id))
    ) {
      throw new BadRequestException(
        'Порядок должен содержать все задачи проекта без повторов',
      );
    }

    const positions = new Map(input.tasks.map((position) => [position.id, position]));
    for (const position of input.tasks) {
      if (position.parentId === position.id) {
        throw new BadRequestException('Задача не может быть родителем самой себе');
      }
      if (position.parentId && !positions.has(position.parentId)) {
        throw new BadRequestException('Родительская задача не принадлежит проекту');
      }
    }

    this.validateSiblingOrder(input.tasks);
    const levels = this.resolveLevels(positions);
    const tasks = await this.repository.updateOrder(
      projectId,
      input.tasks.map((position) => ({
        ...position,
        level: levels.get(position.id) ?? 0,
      })),
    );
    return tasks.map((task) => this.toView(task));
  }

  async delete(projectId: string, taskId: string, ownerId: string) {
    await this.ensureOwnedProject(projectId, ownerId);
    await this.findTask(projectId, taskId);
    const tasks = await this.repository.list(projectId);
    const taskIds = this.collectSubtreeIds(tasks, taskId);
    await this.repository.deleteMany(projectId, taskIds);
  }

  private validateSiblingOrder(
    positions: Array<{ parentId: string | null; orderIndex: number }>,
  ) {
    const siblingIndexes = new Map<string, number[]>();
    for (const { parentId, orderIndex } of positions) {
      const key = parentId ?? 'root';
      const indexes = siblingIndexes.get(key) ?? [];
      indexes.push(orderIndex);
      siblingIndexes.set(key, indexes);
    }

    for (const indexes of siblingIndexes.values()) {
      indexes.sort((left, right) => left - right);
      if (indexes.some((orderIndex, index) => orderIndex !== index)) {
        throw new BadRequestException(
          'Порядок задач одного уровня должен быть непрерывным',
        );
      }
    }
  }

  private resolveLevels(
    positions: Map<string, { parentId: string | null }>,
  ) {
    const levels = new Map<string, number>();
    const visiting = new Set<string>();

    const resolve = (taskId: string): number => {
      const knownLevel = levels.get(taskId);
      if (knownLevel !== undefined) return knownLevel;
      if (visiting.has(taskId)) {
        throw new BadRequestException('Обнаружена циклическая вложенность задач');
      }

      visiting.add(taskId);
      const parentId = positions.get(taskId)?.parentId;
      const level = parentId ? resolve(parentId) + 1 : 0;
      visiting.delete(taskId);

      if (level >= 5) {
        throw new BadRequestException(
          'Допустимо не более пяти уровней задач',
        );
      }
      levels.set(taskId, level);
      return level;
    };

    for (const taskId of positions.keys()) resolve(taskId);
    return levels;
  }

  private collectSubtreeIds(
    tasks: Array<{ id: string; parentId: string | null }>,
    rootId: string,
  ) {
    const collected = new Set([rootId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const task of tasks) {
        if (
          task.parentId &&
          collected.has(task.parentId) &&
          !collected.has(task.id)
        ) {
          collected.add(task.id);
          changed = true;
        }
      }
    }
    return [...collected];
  }

  private async ensureOwnedProject(projectId: string, ownerId: string) {
    if (!(await this.repository.findOwnedProject(projectId, ownerId))) {
      throw new NotFoundException('Проект не найден');
    }
  }

  private async findTask(projectId: string, taskId: string) {
    const task = await this.repository.find(projectId, taskId);
    if (!task) throw new NotFoundException('Задача не найдена');
    return task;
  }

  private toView(task: {
    id: string;
    projectId: string;
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
    customFields: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): TaskView {
    return {
      ...task,
      status: task.status as TaskStatus,
      startDate: dateOnly(task.startDate),
      endDate: dateOnly(task.endDate),
      customFields: task.customFields as Record<string, string>,
    };
  }
}
