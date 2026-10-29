import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UpdateGanttDto } from './gantt.dto.js';
import { GanttRepository } from './gantt.repository.js';
import { GanttService } from './gantt.service.js';

const projectId = '3fdfdce2-13f1-4d62-bd27-17498dc80117';
const ownerId = '292fb488-2764-457b-8a73-79749536a697';
const now = new Date('2026-10-28T00:00:00.000Z');
const defaultColumns = ['title', 'workType', 'assignee', 'duration', 'status'].map((key, index) => ({
  id: `${index + 1}0000000-0000-4000-8000-000000000000`,
  projectId,
  name: key,
  key,
  orderIndex: index,
  isVisible: true,
  isDefault: true,
  createdAt: now,
  updatedAt: now,
}));
const aggregate = {
  id: projectId,
  ownerId,
  name: 'Проект',
  startDate: new Date('2026-11-01T00:00:00.000Z'),
  endDate: new Date('2026-11-30T00:00:00.000Z'),
  excludeNonWorkingDays: true,
  publicToken: 'token',
  createdAt: now,
  updatedAt: now,
  columns: defaultColumns,
  tasks: [],
  milestones: [],
  nonWorkingDays: [],
};

function repositoryMock() {
  return {
    findOwned: vi.fn(),
    findConflictingIds: vi.fn().mockResolvedValue(0),
    replace: vi.fn(),
  };
}

function validInput(): UpdateGanttDto {
  return {
    columns: defaultColumns.map(({ id, name, isVisible }) => ({ id, name, isVisible })),
    tasks: [],
    milestones: [],
    nonWorkingDays: [],
  };
}

function validTask(
  id: string,
  orderIndex: number,
  parentId: string | null = null,
): UpdateGanttDto['tasks'][number] {
  return {
    id,
    parentId,
    orderIndex,
    title: id,
    workType: null,
    assignee: '',
    estimate: null,
    comment: null,
    status: 'Ожидает',
    startDate: null,
    endDate: null,
    color: 'sage',
    includeInDuration: true,
    periods: [],
    isCollapsed: false,
    customFields: {},
  };
}

describe('GanttService', () => {
  let repository: ReturnType<typeof repositoryMock>;
  let service: GanttService;

  beforeEach(() => {
    repository = repositoryMock();
    service = new GanttService(repository as unknown as GanttRepository);
  });

  it('requires project ownership when loading the aggregate', async () => {
    repository.findOwned.mockResolvedValue(null);
    await expect(service.get(projectId, ownerId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('validates and replaces the full aggregate once', async () => {
    repository.findOwned.mockResolvedValue(aggregate);
    repository.replace.mockResolvedValue(aggregate);

    const result = await service.update(projectId, ownerId, validInput());

    expect(repository.replace).toHaveBeenCalledOnce();
    expect(result.project.id).toBe(projectId);
    expect(result.project.publicToken).toBe(aggregate.publicToken);
  });

  it('normalizes duplicate sibling indexes instead of rejecting the save', async () => {
    repository.findOwned.mockResolvedValue(aggregate);
    repository.replace.mockResolvedValue(aggregate);
    const input = validInput();
    input.tasks = [
      validTask('af9d8fc7-a484-49ea-838b-808640483a38', 0),
      validTask('e46ef151-595a-4ab9-89c2-3c75a65fed15', 0),
    ];

    await expect(service.update(projectId, ownerId, input)).resolves.toBeDefined();

    const savedTasks = repository.replace.mock.calls[0]?.[1].tasks as Array<{
      id: string;
      orderIndex: number;
    }>;
    expect(savedTasks.map(({ id, orderIndex }) => ({ id, orderIndex }))).toEqual([
      { id: 'af9d8fc7-a484-49ea-838b-808640483a38', orderIndex: 0 },
      { id: 'e46ef151-595a-4ab9-89c2-3c75a65fed15', orderIndex: 1 },
    ]);
  });

  it('rejects cyclic task hierarchy before starting persistence', async () => {
    repository.findOwned.mockResolvedValue(aggregate);
    const input = validInput();
    input.tasks = [
      {
        id: 'af9d8fc7-a484-49ea-838b-808640483a38',
        parentId: 'e46ef151-595a-4ab9-89c2-3c75a65fed15',
        orderIndex: 0,
        title: 'A', workType: null, assignee: '', estimate: null, comment: null,
        status: 'Ожидает', startDate: null, endDate: null,
        color: 'sage', includeInDuration: true, periods: [], isCollapsed: false, customFields: {},
      },
      {
        id: 'e46ef151-595a-4ab9-89c2-3c75a65fed15',
        parentId: 'af9d8fc7-a484-49ea-838b-808640483a38',
        orderIndex: 0,
        title: 'B', workType: null, assignee: '', estimate: null, comment: null,
        status: 'Ожидает', startDate: null, endDate: null,
        color: 'sage', includeInDuration: true, periods: [], isCollapsed: false, customFields: {},
      },
    ];

    await expect(service.update(projectId, ownerId, input)).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.replace).not.toHaveBeenCalled();
  });

  it('rejects identifiers that belong to another project', async () => {
    repository.findOwned.mockResolvedValue(aggregate);
    repository.findConflictingIds.mockResolvedValue(1);

    await expect(service.update(projectId, ownerId, validInput())).rejects.toThrow(
      'Один из объектов принадлежит другому проекту',
    );
    expect(repository.replace).not.toHaveBeenCalled();
  });

  it('rejects a task comment longer than 1000 characters', async () => {
    repository.findOwned.mockResolvedValue(aggregate);
    const input = validInput();
    input.tasks = [{
      id: 'af9d8fc7-a484-49ea-838b-808640483a38',
      parentId: null,
      orderIndex: 0,
      title: 'Задача',
      workType: null,
      assignee: '',
      estimate: null,
      comment: 'а'.repeat(1001),
      status: 'Ожидает',
      startDate: null,
      endDate: null,
      color: 'sage',
      includeInDuration: true,
      periods: [],
      isCollapsed: false,
      customFields: {},
    }];

    await expect(service.update(projectId, ownerId, input)).rejects.toThrow(
      'Комментарий должен быть не длиннее 1000 символов',
    );
    expect(repository.replace).not.toHaveBeenCalled();
  });
});
