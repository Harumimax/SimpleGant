import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_PROJECT_COLUMNS, ProjectsRepository } from './projects.repository.js';
import { ProjectsService } from './projects.service.js';

const project = {
  id: 'd73427a3-f98e-4c62-864d-b652131445aa',
  ownerId: '14e5bd72-5b22-48c3-a619-1aa598d2db85',
  name: 'Запуск продукта',
  startDate: new Date('2026-11-01T00:00:00.000Z'),
  endDate: new Date('2027-01-31T00:00:00.000Z'),
  publicToken: 'secret-token',
  createdAt: new Date('2026-10-27T10:00:00.000Z'),
  updatedAt: new Date('2026-10-27T10:00:00.000Z'),
  columns: DEFAULT_PROJECT_COLUMNS.map((column, index) => ({
    id: `column-${index}`,
    projectId: 'd73427a3-f98e-4c62-864d-b652131445aa',
    ...column,
    isVisible: true,
    isDefault: true,
    createdAt: new Date('2026-10-27T10:00:00.000Z'),
    updatedAt: new Date('2026-10-27T10:00:00.000Z'),
  })),
};

function createRepositoryMock() {
  return {
    listByOwner: vi.fn(),
    findOwned: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    countMilestonesOutsideRange: vi.fn().mockResolvedValue(0),
    countNonWorkingDaysOutsideRange: vi.fn().mockResolvedValue(0),
    deleteOwned: vi.fn(),
  };
}

describe('ProjectsService', () => {
  it('creates a project for the authenticated owner and returns five columns', async () => {
    const repository = createRepositoryMock();
    repository.create.mockResolvedValue(project);
    const service = new ProjectsService(
      repository as unknown as ProjectsRepository,
    );

    const result = await service.create(project.ownerId, {
      name: project.name,
      startDate: '2026-11-01',
      endDate: '2027-01-31',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: project.ownerId,
        name: project.name,
        startDate: new Date('2026-11-01T00:00:00.000Z'),
        endDate: new Date('2027-01-31T00:00:00.000Z'),
        publicToken: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      }),
    );
    expect(result.columns.map(({ name }) => name)).toEqual([
      'Название',
      'Тип работ',
      'Исполнитель',
      'Длительность',
      'Статус',
    ]);
    expect(result).not.toHaveProperty('publicToken');
    expect(result.startDate).toBe('2026-11-01');
  });

  it('rejects an end date earlier than the start date', async () => {
    const repository = createRepositoryMock();
    const service = new ProjectsService(
      repository as unknown as ProjectsRepository,
    );

    await expect(
      service.create(project.ownerId, {
        name: project.name,
        startDate: '2026-12-01',
        endDate: '2026-11-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('looks up a project with both project and owner ids before updating', async () => {
    const repository = createRepositoryMock();
    repository.findOwned.mockResolvedValue(project);
    repository.update.mockResolvedValue({ ...project, name: 'Новый план' });
    const service = new ProjectsService(
      repository as unknown as ProjectsRepository,
    );

    await service.update(project.id, project.ownerId, { name: 'Новый план' });

    expect(repository.findOwned).toHaveBeenCalledWith(project.id, project.ownerId);
    expect(repository.update).toHaveBeenCalledWith(project.id, {
      name: 'Новый план',
      startDate: project.startDate,
      endDate: project.endDate,
    });
  });

  it('returns not found when the owner cannot delete the project', async () => {
    const repository = createRepositoryMock();
    repository.deleteOwned.mockResolvedValue(false);
    const service = new ProjectsService(
      repository as unknown as ProjectsRepository,
    );

    await expect(
      service.delete(project.id, project.ownerId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not shrink the project period past an existing milestone', async () => {
    const repository = createRepositoryMock();
    repository.findOwned.mockResolvedValue(project);
    repository.countMilestonesOutsideRange.mockResolvedValue(1);
    const service = new ProjectsService(
      repository as unknown as ProjectsRepository,
    );

    await expect(service.update(project.id, project.ownerId, {
      endDate: '2026-12-31',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('does not shrink the project period past an existing non-working day', async () => {
    const repository = createRepositoryMock();
    repository.findOwned.mockResolvedValue(project);
    repository.countNonWorkingDaysOutsideRange.mockResolvedValue(1);
    const service = new ProjectsService(
      repository as unknown as ProjectsRepository,
    );

    await expect(service.update(project.id, project.ownerId, {
      endDate: '2026-12-31',
    })).rejects.toThrow('Новый период проекта не должен исключать вехи или нерабочие дни');
    expect(repository.update).not.toHaveBeenCalled();
  });
});
