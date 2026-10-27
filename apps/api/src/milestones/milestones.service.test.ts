import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { MilestonesRepository } from './milestones.repository.js';
import { MilestonesService } from './milestones.service.js';

const projectId = 'd73427a3-f98e-4c62-864d-b652131445aa';
const ownerId = '14e5bd72-5b22-48c3-a619-1aa598d2db85';
const milestoneId = '7826ff0b-e6ca-4abf-9219-d30ec7f5e459';
const project = {
  id: projectId,
  startDate: new Date('2026-11-01T00:00:00.000Z'),
  endDate: new Date('2026-11-30T00:00:00.000Z'),
};
const milestone = {
  id: milestoneId,
  projectId,
  title: 'Релиз',
  date: new Date('2026-11-20T00:00:00.000Z'),
  color: 'coral',
  createdAt: new Date('2026-10-28T00:00:00.000Z'),
  updatedAt: new Date('2026-10-28T00:00:00.000Z'),
};

function repositoryMock() {
  return {
    findOwnedProject: vi.fn(),
    list: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

describe('MilestonesService', () => {
  it('creates a milestone with a server-owned default color', async () => {
    const repository = repositoryMock();
    repository.findOwnedProject.mockResolvedValue(project);
    repository.create.mockResolvedValue(milestone);
    const service = new MilestonesService(
      repository as unknown as MilestonesRepository,
    );

    const result = await service.create(projectId, ownerId, {
      title: 'Релиз',
      date: '2026-11-20',
    });

    expect(repository.create).toHaveBeenCalledWith({
      projectId,
      title: 'Релиз',
      date: new Date('2026-11-20T00:00:00.000Z'),
      color: 'coral',
    });
    expect(result.date).toBe('2026-11-20');
  });

  it('rejects a date outside the project range', async () => {
    const repository = repositoryMock();
    repository.findOwnedProject.mockResolvedValue(project);
    const service = new MilestonesService(
      repository as unknown as MilestonesRepository,
    );

    await expect(service.create(projectId, ownerId, {
      title: 'Поздний релиз',
      date: '2026-12-01',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('checks ownership before listing or mutating milestones', async () => {
    const repository = repositoryMock();
    repository.findOwnedProject.mockResolvedValue(null);
    const service = new MilestonesService(
      repository as unknown as MilestonesRepository,
    );

    await expect(service.list(projectId, ownerId)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.delete(projectId, milestoneId, ownerId)).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.list).not.toHaveBeenCalled();
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('updates and deletes only milestones from the owned project', async () => {
    const repository = repositoryMock();
    repository.findOwnedProject.mockResolvedValue(project);
    repository.find.mockResolvedValue(milestone);
    repository.update.mockResolvedValue({ ...milestone, title: 'Запуск' });
    repository.delete.mockResolvedValue(1);
    const service = new MilestonesService(
      repository as unknown as MilestonesRepository,
    );

    const updated = await service.update(projectId, milestoneId, ownerId, {
      title: 'Запуск',
      color: 'teal',
    });
    await service.delete(projectId, milestoneId, ownerId);

    expect(repository.update).toHaveBeenCalledWith(milestoneId, {
      title: 'Запуск',
      date: milestone.date,
      color: 'teal',
    });
    expect(repository.delete).toHaveBeenCalledWith(projectId, milestoneId);
    expect(updated.title).toBe('Запуск');
  });
});
