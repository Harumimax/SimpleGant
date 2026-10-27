import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { CreateTaskDto, UpdateTaskDto } from './tasks.dto.js';
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
    });
    return this.toView(task);
  }

  async delete(projectId: string, taskId: string, ownerId: string) {
    await this.ensureOwnedProject(projectId, ownerId);
    if (!(await this.repository.delete(projectId, taskId))) {
      throw new NotFoundException('Задача не найдена');
    }
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
