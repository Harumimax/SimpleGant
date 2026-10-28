import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';

import type { CreateProjectDto, UpdateProjectDto } from './projects.dto.js';
import { ProjectsRepository } from './projects.repository.js';
import type { ProjectDetailView, ProjectView } from './project.types.js';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(ProjectsRepository)
    private readonly repository: ProjectsRepository,
  ) {}

  async list(ownerId: string): Promise<ProjectView[]> {
    const projects = await this.repository.listByOwner(ownerId);
    return projects.map((project) => this.toProjectView(project));
  }

  async get(id: string, ownerId: string): Promise<ProjectDetailView> {
    const project = await this.findOwned(id, ownerId);
    return this.toProjectDetailView(project);
  }

  async create(
    ownerId: string,
    input: CreateProjectDto,
  ): Promise<ProjectDetailView> {
    const dates = this.validateDates(input.startDate, input.endDate);
    const project = await this.repository.create({
      ownerId,
      name: input.name,
      ...dates,
      publicToken: randomBytes(32).toString('base64url'),
    });
    return this.toProjectDetailView(project);
  }

  async update(
    id: string,
    ownerId: string,
    input: UpdateProjectDto,
  ): Promise<ProjectDetailView> {
    const current = await this.findOwned(id, ownerId);
    const startDate = input.startDate ?? this.dateOnly(current.startDate);
    const endDate = input.endDate ?? this.dateOnly(current.endDate);
    const dates = this.validateDates(startDate, endDate);
    const periodChanged = input.startDate !== undefined || input.endDate !== undefined;
    const [milestonesOutside, nonWorkingDaysOutside] = periodChanged
      ? await Promise.all([
          this.repository.countMilestonesOutsideRange(id, dates.startDate, dates.endDate),
          this.repository.countNonWorkingDaysOutsideRange(id, dates.startDate, dates.endDate),
        ])
      : [0, 0];
    if (milestonesOutside > 0 || nonWorkingDaysOutside > 0) {
      throw new BadRequestException(
        'Новый период проекта не должен исключать вехи или нерабочие дни',
      );
    }
    const project = await this.repository.update(id, {
      name: input.name ?? current.name,
      ...dates,
    });
    return this.toProjectDetailView(project);
  }

  async delete(id: string, ownerId: string) {
    if (!(await this.repository.deleteOwned(id, ownerId))) {
      throw new NotFoundException('Проект не найден');
    }
  }

  private async findOwned(id: string, ownerId: string) {
    const project = await this.repository.findOwned(id, ownerId);
    if (!project) {
      throw new NotFoundException('Проект не найден');
    }
    return project;
  }

  private validateDates(start: string, end: string) {
    const startDate = this.parseDateOnly(start);
    const endDate = this.parseDateOnly(end);
    if (startDate > endDate) {
      throw new BadRequestException(
        'Дата окончания не может быть раньше даты начала',
      );
    }
    return { startDate, endDate };
  }

  private parseDateOnly(value: string) {
    return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  }

  private dateOnly(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  private toProjectView(project: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
  }): ProjectView {
    return {
      id: project.id,
      name: project.name,
      startDate: this.dateOnly(project.startDate),
      endDate: this.dateOnly(project.endDate),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private toProjectDetailView(project: Parameters<ProjectsService['toProjectView']>[0] & {
    columns: Array<{
      id: string;
      name: string;
      key: string;
      orderIndex: number;
      isVisible: boolean;
      isDefault: boolean;
    }>;
  }): ProjectDetailView {
    return {
      ...this.toProjectView(project),
      columns: project.columns,
    };
  }
}
