import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ProjectColumnsRepository } from './project-columns.repository.js';
import { ProjectColumnsService } from './project-columns.service.js';

const projectId = 'd73427a3-f98e-4c62-864d-b652131445aa';
const ownerId = '14e5bd72-5b22-48c3-a619-1aa598d2db85';

const columns = [
  ['11111111-1111-4111-8111-111111111111', 'Название', 'title'],
  ['22222222-2222-4222-8222-222222222222', 'Тип работ', 'workType'],
  ['33333333-3333-4333-8333-333333333333', 'Исполнитель', 'assignee'],
  ['44444444-4444-4444-8444-444444444444', 'Длительность', 'duration'],
  ['55555555-5555-4555-8555-555555555555', 'Статус', 'status'],
].map(([id, name, key], orderIndex) => ({
  id: id!,
  projectId,
  name: name!,
  key: key!,
  orderIndex,
  isVisible: true,
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

function repositoryMock() {
  return { findOwnedProject: vi.fn(), replace: vi.fn() };
}

describe('ProjectColumnsService', () => {
  it('rejects access to a project owned by another user', async () => {
    const repository = repositoryMock();
    repository.findOwnedProject.mockResolvedValue(null);
    const service = new ProjectColumnsService(
      repository as unknown as ProjectColumnsRepository,
    );

    await expect(service.configure(projectId, ownerId, { columns: [] }))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('keeps server-owned keys and adds a custom text column', async () => {
    const repository = repositoryMock();
    repository.findOwnedProject.mockResolvedValue({ id: projectId, columns });
    repository.replace.mockImplementation(async (_projectId, input) => input);
    const service = new ProjectColumnsService(
      repository as unknown as ProjectColumnsRepository,
    );

    await service.configure(projectId, ownerId, {
      columns: [
        ...columns.map(({ id, name }) => ({ id, name, isVisible: true })),
        { name: 'Бюджет', isVisible: false },
      ],
    });

    expect(repository.replace).toHaveBeenCalledWith(
      projectId,
      expect.arrayContaining([
        expect.objectContaining({
          id: columns[0]!.id,
          key: 'title',
          orderIndex: 0,
          isDefault: true,
        }),
        expect.objectContaining({
          name: 'Бюджет',
          key: expect.stringMatching(/^custom_[a-f0-9]{16}$/),
          orderIndex: 5,
          isDefault: false,
        }),
      ]),
      [],
    );
  });

  it('rejects removing defaults, foreign ids and duplicate names', async () => {
    const repository = repositoryMock();
    repository.findOwnedProject.mockResolvedValue({ id: projectId, columns });
    const service = new ProjectColumnsService(
      repository as unknown as ProjectColumnsRepository,
    );
    const input = columns.map(({ id, name }) => ({ id, name, isVisible: true }));

    await expect(service.configure(projectId, ownerId, {
      columns: input.slice(1),
    })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.configure(projectId, ownerId, {
      columns: [...input, {
        id: '66666666-6666-4666-8666-666666666666',
        name: 'Чужая',
        isVisible: true,
      }],
    })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.configure(projectId, ownerId, {
      columns: input.map((column, index) =>
        index === 1 ? { ...column, name: 'название' } : column,
      ),
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.replace).not.toHaveBeenCalled();
  });

  it('marks values of a removed custom column for transactional cleanup', async () => {
    const repository = repositoryMock();
    const customColumn = {
      ...columns[0]!,
      id: '66666666-6666-4666-8666-666666666666',
      name: 'Бюджет',
      key: 'custom_budget',
      orderIndex: 5,
      isDefault: false,
    };
    repository.findOwnedProject.mockResolvedValue({
      id: projectId,
      columns: [...columns, customColumn],
    });
    repository.replace.mockResolvedValue(columns);
    const service = new ProjectColumnsService(
      repository as unknown as ProjectColumnsRepository,
    );

    await service.configure(projectId, ownerId, {
      columns: columns.map(({ id, name }) => ({ id, name, isVisible: true })),
    });

    expect(repository.replace).toHaveBeenCalledWith(
      projectId,
      expect.any(Array),
      ['custom_budget'],
    );
  });
});
