import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { TasksRepository } from './tasks.repository.js';
import { TasksService } from './tasks.service.js';

const projectId = 'd73427a3-f98e-4c62-864d-b652131445aa';
const ownerId = '14e5bd72-5b22-48c3-a619-1aa598d2db85';
const task = {
  id: '7826ff0b-e6ca-4abf-9219-d30ec7f5e459',
  projectId,
  parentId: null,
  orderIndex: 0,
  level: 0,
  title: 'Подготовить макет',
  workType: 'Дизайн',
  assignee: 'Анна',
  estimate: '5 дней',
  status: 'Ожидает',
  startDate: new Date('2026-11-02T00:00:00.000Z'),
  endDate: new Date('2026-11-13T00:00:00.000Z'),
  color: 'sage',
  isCollapsed: false,
  customFields: {},
  createdAt: new Date('2026-10-27T10:00:00.000Z'),
  updatedAt: new Date('2026-10-27T10:00:00.000Z'),
};

function repositoryMock() {
  return {
    findOwnedProject: vi.fn(), list: vi.fn(), find: vi.fn(), nextOrderIndex: vi.fn(),
    create: vi.fn(), updateWithParentDates: vi.fn(),
    updateOrder: vi.fn(), deleteMany: vi.fn(),
  };
}

function nestedTask(
  id: string,
  parentId: string | null,
  orderIndex: number,
  level: number,
) {
  return { ...task, id, parentId, orderIndex, level };
}

describe('TasksService', () => {
  it('calculates a ten-working-day range and server-owned defaults', async () => {
    const repository = repositoryMock();
    repository.findOwnedProject.mockResolvedValue({ id: projectId });
    repository.nextOrderIndex.mockResolvedValue(0);
    repository.create.mockResolvedValue(task);
    const service = new TasksService(repository as unknown as TasksRepository);

    const result = await service.create(projectId, ownerId, {
      title: task.title,
      assignee: task.assignee,
      startDate: '2026-11-02',
    });

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      projectId,
      orderIndex: 0,
      status: 'Ожидает',
      color: 'sage',
      startDate: new Date('2026-11-02T00:00:00.000Z'),
      endDate: new Date('2026-11-13T00:00:00.000Z'),
    }));
    expect(result.endDate).toBe('2026-11-13');
  });

  it('does not list tasks when the project is not owned by the user', async () => {
    const repository = repositoryMock();
    repository.findOwnedProject.mockResolvedValue(null);
    const service = new TasksService(repository as unknown as TasksRepository);

    await expect(service.list(projectId, ownerId)).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.list).not.toHaveBeenCalled();
  });

  it('counts ten working days when the supplied boundary is a weekend', async () => {
    const repository = repositoryMock();
    repository.findOwnedProject.mockResolvedValue({ id: projectId });
    repository.nextOrderIndex.mockResolvedValue(1);
    repository.create.mockImplementation(async (input) => ({ ...task, ...input }));
    const service = new TasksService(repository as unknown as TasksRepository);

    const result = await service.create(projectId, ownerId, {
      title: task.title,
      assignee: task.assignee,
      startDate: '2026-11-07',
    });

    expect(result.endDate).toBe('2026-11-20');
  });

  it('clears optional fields while preserving server-owned task fields', async () => {
    const repository = repositoryMock();
    repository.findOwnedProject.mockResolvedValue({ id: projectId });
    repository.list.mockResolvedValue([task]);
    repository.updateWithParentDates.mockResolvedValue([
      { ...task, workType: null, estimate: null },
    ]);
    const service = new TasksService(repository as unknown as TasksRepository);

    await service.update(projectId, task.id, ownerId, { workType: null, estimate: null });

    expect(repository.updateWithParentDates).toHaveBeenCalledWith(
      projectId,
      task.id,
      expect.objectContaining({
      workType: null,
      estimate: null,
      title: task.title,
      assignee: task.assignee,
      }),
      [],
    );
  });

  it('recalculates ancestor dates when a child range changes', async () => {
    const repository = repositoryMock();
    const childId = '22222222-2222-4222-8222-222222222222';
    const child = {
      ...nestedTask(childId, task.id, 0, 1),
      startDate: new Date('2026-11-04T00:00:00.000Z'),
      endDate: new Date('2026-11-06T00:00:00.000Z'),
    };
    repository.findOwnedProject.mockResolvedValue({ id: projectId });
    repository.list.mockResolvedValue([task, child]);
    repository.updateWithParentDates.mockResolvedValue([
      { ...task, startDate: new Date('2026-12-01T00:00:00.000Z'), endDate: new Date('2026-12-10T00:00:00.000Z') },
      { ...child, startDate: new Date('2026-12-01T00:00:00.000Z'), endDate: new Date('2026-12-10T00:00:00.000Z') },
    ]);
    const service = new TasksService(repository as unknown as TasksRepository);

    await service.update(projectId, childId, ownerId, {
      startDate: '2026-12-01',
      endDate: '2026-12-10',
    });

    expect(repository.updateWithParentDates).toHaveBeenCalledWith(
      projectId,
      childId,
      expect.objectContaining({
        startDate: new Date('2026-12-01T00:00:00.000Z'),
        endDate: new Date('2026-12-10T00:00:00.000Z'),
      }),
      [{
        id: task.id,
        startDate: new Date('2026-12-01T00:00:00.000Z'),
        endDate: new Date('2026-12-10T00:00:00.000Z'),
      }],
    );
  });

  it('rejects manual date changes for a parent task', async () => {
    const repository = repositoryMock();
    repository.findOwnedProject.mockResolvedValue({ id: projectId });
    repository.list.mockResolvedValue([
      task,
      nestedTask('22222222-2222-4222-8222-222222222222', task.id, 0, 1),
    ]);
    const service = new TasksService(repository as unknown as TasksRepository);

    await expect(service.update(projectId, task.id, ownerId, {
      startDate: '2026-12-01',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.updateWithParentDates).not.toHaveBeenCalled();
  });

  it('derives hierarchy levels and saves a complete deterministic order', async () => {
    const repository = repositoryMock();
    const rootId = '11111111-1111-4111-8111-111111111111';
    const childId = '22222222-2222-4222-8222-222222222222';
    repository.findOwnedProject.mockResolvedValue({ id: projectId });
    repository.list.mockResolvedValue([
      nestedTask(rootId, null, 0, 0),
      nestedTask(childId, null, 1, 0),
    ]);
    repository.updateOrder.mockResolvedValue([
      nestedTask(rootId, null, 0, 0),
      nestedTask(childId, rootId, 0, 1),
    ]);
    const service = new TasksService(repository as unknown as TasksRepository);

    await service.reorder(projectId, ownerId, {
      tasks: [
        { id: rootId, parentId: null, orderIndex: 0 },
        { id: childId, parentId: rootId, orderIndex: 0 },
      ],
    });

    expect(repository.updateOrder).toHaveBeenCalledWith(projectId, [
      { id: rootId, parentId: null, orderIndex: 0, level: 0, startDate: task.startDate, endDate: task.endDate },
      { id: childId, parentId: rootId, orderIndex: 0, level: 1, startDate: task.startDate, endDate: task.endDate },
    ]);
  });

  it('rejects hierarchy cycles and a sixth total level', async () => {
    const ids = Array.from(
      { length: 6 },
      (_, index) => `${index + 1}0000000-0000-4000-8000-000000000000`,
    );
    const repository = repositoryMock();
    repository.findOwnedProject.mockResolvedValue({ id: projectId });
    repository.list.mockResolvedValue(
      ids.map((id, index) =>
        nestedTask(id, index === 0 ? null : ids[index - 1]!, 0, index),
      ),
    );
    const service = new TasksService(repository as unknown as TasksRepository);

    await expect(
      service.reorder(projectId, ownerId, {
        tasks: ids.map((id, index) => ({
          id,
          parentId: index === 0 ? null : ids[index - 1]!,
          orderIndex: 0,
        })),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.reorder(projectId, ownerId, {
        tasks: ids.map((id, index) => ({
          id,
          parentId: index === 0 ? ids[1]! : index === 1 ? ids[0]! : null,
          orderIndex: index > 1 ? index - 2 : 0,
        })),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.updateOrder).not.toHaveBeenCalled();
  });

  it('deletes a task together with all descendants', async () => {
    const repository = repositoryMock();
    const childId = '22222222-2222-4222-8222-222222222222';
    const grandchildId = '33333333-3333-4333-8333-333333333333';
    repository.findOwnedProject.mockResolvedValue({ id: projectId });
    repository.find.mockResolvedValue(task);
    repository.list.mockResolvedValue([
      task,
      nestedTask(childId, task.id, 0, 1),
      nestedTask(grandchildId, childId, 0, 2),
    ]);
    repository.deleteMany.mockResolvedValue(3);
    const service = new TasksService(repository as unknown as TasksRepository);

    await service.delete(projectId, task.id, ownerId);

    expect(repository.deleteMany).toHaveBeenCalledWith(
      projectId,
      expect.arrayContaining([task.id, childId, grandchildId]),
      [],
    );
  });
});
