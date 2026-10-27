import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';

import type { ProjectColumnView } from '../projects/project.types.js';
import type { ConfigureProjectColumnsDto } from './project-columns.dto.js';
import { ProjectColumnsRepository } from './project-columns.repository.js';

@Injectable()
export class ProjectColumnsService {
  constructor(
    @Inject(ProjectColumnsRepository)
    private readonly repository: ProjectColumnsRepository,
  ) {}

  async configure(
    projectId: string,
    ownerId: string,
    input: ConfigureProjectColumnsDto,
  ): Promise<ProjectColumnView[]> {
    const project = await this.repository.findOwnedProject(projectId, ownerId);
    if (!project) throw new NotFoundException('Проект не найден');

    const existingById = new Map(
      project.columns.map((column) => [column.id, column]),
    );
    const submittedIds = input.columns.flatMap(({ id }) => id ? [id] : []);
    if (
      new Set(submittedIds).size !== submittedIds.length ||
      submittedIds.some((id) => !existingById.has(id))
    ) {
      throw new BadRequestException('Колонки не принадлежат проекту или повторяются');
    }

    const submittedIdSet = new Set(submittedIds);
    if (
      project.columns.some(
        ({ id, isDefault }) => isDefault && !submittedIdSet.has(id),
      )
    ) {
      throw new BadRequestException('Системные колонки нельзя удалить');
    }

    const normalizedNames = input.columns.map(({ name }) => name.toLocaleLowerCase('ru'));
    if (new Set(normalizedNames).size !== normalizedNames.length) {
      throw new BadRequestException('Названия колонок не должны повторяться');
    }

    const removedCustomKeys = project.columns
      .filter(
        ({ id, isDefault }) => !isDefault && !submittedIdSet.has(id),
      )
      .map(({ key }) => key);

    return this.repository.replace(
      projectId,
      input.columns.map((column, orderIndex) => {
        const existing = column.id ? existingById.get(column.id) : undefined;
        return {
          id: existing?.id,
          name: column.name,
          key: existing?.key ?? `custom_${randomBytes(8).toString('hex')}`,
          orderIndex,
          isVisible: column.isVisible,
          isDefault: existing?.isDefault ?? false,
        };
      }),
      removedCustomKeys,
    );
  }
}
