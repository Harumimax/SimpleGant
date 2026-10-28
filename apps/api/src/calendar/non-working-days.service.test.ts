import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { NonWorkingDaysRepository } from './non-working-days.repository.js';
import { NonWorkingDaysService } from './non-working-days.service.js';

const projectId = 'd73427a3-f98e-4c62-864d-b652131445aa';
const ownerId = '14e5bd72-5b22-48c3-a619-1aa598d2db85';
const dayId = '7826ff0b-e6ca-4abf-9219-d30ec7f5e459';
const project = {
  id: projectId,
  startDate: new Date('2026-11-01T00:00:00.000Z'),
  endDate: new Date('2026-11-30T00:00:00.000Z'),
};
const nonWorkingDay = {
  id: dayId,
  projectId,
  date: new Date('2026-11-04T00:00:00.000Z'),
  label: 'Праздник',
  createdAt: new Date('2026-10-28T10:00:00.000Z'),
  updatedAt: new Date('2026-10-28T10:00:00.000Z'),
};

function repositoryMock() {
  return {
    findOwnedProject: vi.fn(),
    list: vi.fn(),
    find: vi.fn(),
    findByDate: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  };
}

describe('NonWorkingDaysService', () => {
  it('creates and lists a named non-working day inside the project period', async () => {
    const repository = repositoryMock();
    repository.findOwnedProject.mockResolvedValue(project);
    repository.findByDate.mockResolvedValue(null);
    repository.create.mockResolvedValue(nonWorkingDay);
    repository.list.mockResolvedValue([nonWorkingDay]);
    const service = new NonWorkingDaysService(
      repository as unknown as NonWorkingDaysRepository,
    );

    const created = await service.create(projectId, ownerId, {
      date: '2026-11-04',
      label: 'Праздник',
    });
    const listed = await service.list(projectId, ownerId);

    expect(repository.create).toHaveBeenCalledWith({
      projectId,
      date: new Date('2026-11-04T00:00:00.000Z'),
      label: 'Праздник',
    });
    expect(created.date).toBe('2026-11-04');
    expect(listed).toHaveLength(1);
  });

  it('rejects dates outside the period and duplicate dates', async () => {
    const repository = repositoryMock();
    repository.findOwnedProject.mockResolvedValue(project);
    const service = new NonWorkingDaysService(
      repository as unknown as NonWorkingDaysRepository,
    );

    await expect(service.create(projectId, ownerId, {
      date: '2026-12-01',
    })).rejects.toBeInstanceOf(BadRequestException);

    repository.findByDate.mockResolvedValue(nonWorkingDay);
    await expect(service.create(projectId, ownerId, {
      date: '2026-11-04',
    })).rejects.toThrow('Эта дата уже отмечена как нерабочая');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('enforces ownership and deletes only a day from the owned project', async () => {
    const repository = repositoryMock();
    repository.findOwnedProject.mockResolvedValue(null);
    const service = new NonWorkingDaysService(
      repository as unknown as NonWorkingDaysRepository,
    );

    await expect(service.list(projectId, ownerId)).rejects.toBeInstanceOf(NotFoundException);

    repository.findOwnedProject.mockResolvedValue(project);
    repository.find.mockResolvedValue(nonWorkingDay);
    repository.delete.mockResolvedValue(1);
    await service.delete(projectId, dayId, ownerId);

    expect(repository.delete).toHaveBeenCalledWith(projectId, dayId);
  });
});
