import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { PublicShareRepository } from './public-share.repository.js';
import { PublicShareService } from './public-share.service.js';

const token = 'abcdefghijklmnopqrstuvwxyzABCDEFGH123456789';
const now = new Date('2026-10-28T00:00:00.000Z');

function repositoryMock() {
  return { findByToken: vi.fn() };
}

describe('PublicShareService', () => {
  it('returns presentation data without owner, token or relation metadata', async () => {
    const repository = repositoryMock();
    repository.findByToken.mockResolvedValue({
      id: 'project-id',
      ownerId: 'private-owner-id',
      publicToken: token,
      name: 'Публичный проект',
      startDate: new Date('2026-11-01T00:00:00.000Z'),
      endDate: new Date('2026-11-30T00:00:00.000Z'),
      excludeNonWorkingDays: true,
      createdAt: now,
      updatedAt: now,
      columns: [{
        id: 'column-id', projectId: 'project-id', name: 'Название', key: 'title',
        orderIndex: 0, isVisible: true, isDefault: true, createdAt: now, updatedAt: now,
      }],
      tasks: [{
        id: 'task-id', projectId: 'project-id', parentId: null, orderIndex: 0,
        level: 0, title: 'Задача', workType: null, assignee: '', estimate: null,
        comment: 'Важный комментарий',
        status: 'Ожидает', startDate: null, endDate: null, color: 'sage',
        isCollapsed: false, customFields: {}, createdAt: now, updatedAt: now,
      }],
      milestones: [],
      nonWorkingDays: [],
      stickers: [{
        id: 'sticker-id', projectId: 'project-id', text: 'Публичная заметка',
        color: 'amber', xDayOffset: 2, yRowOffset: 1, size: 160, zIndex: 0,
        createdAt: now, updatedAt: now,
      }],
    });
    const service = new PublicShareService(
      repository as unknown as PublicShareRepository,
    );

    const result = await service.get(token);
    const serialized = JSON.stringify(result);

    expect(result.project.name).toBe('Публичный проект');
    expect(result.tasks[0]?.title).toBe('Задача');
    expect(result.tasks[0]?.comment).toBe('Важный комментарий');
    expect(result.stickers[0]?.text).toBe('Публичная заметка');
    expect(serialized).not.toContain('private-owner-id');
    expect(serialized).not.toContain(token);
    expect(serialized).not.toContain('projectId');
    expect(serialized).not.toContain('createdAt');
  });

  it('returns the same not-found response for invalid and unknown tokens', async () => {
    const repository = repositoryMock();
    const service = new PublicShareService(
      repository as unknown as PublicShareRepository,
    );

    await expect(service.get('invalid')).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findByToken).not.toHaveBeenCalled();

    repository.findByToken.mockResolvedValue(null);
    await expect(service.get(token)).rejects.toBeInstanceOf(NotFoundException);
  });
});
