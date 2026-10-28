import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateNonWorkingDayDto } from './non-working-days.dto.js';
import { NonWorkingDaysRepository } from './non-working-days.repository.js';
import type { NonWorkingDayView } from './non-working-day.types.js';

@Injectable()
export class NonWorkingDaysService {
  constructor(
    @Inject(NonWorkingDaysRepository)
    private readonly repository: NonWorkingDaysRepository,
  ) {}

  async list(projectId: string, ownerId: string): Promise<NonWorkingDayView[]> {
    await this.findOwnedProject(projectId, ownerId);
    return (await this.repository.list(projectId)).map((day) => this.toView(day));
  }

  async create(
    projectId: string,
    ownerId: string,
    input: CreateNonWorkingDayDto,
  ): Promise<NonWorkingDayView> {
    const project = await this.findOwnedProject(projectId, ownerId);
    const date = this.parseDateOnly(input.date);
    if (date < project.startDate || date > project.endDate) {
      throw new BadRequestException('Нерабочий день должен входить в период проекта');
    }
    if (await this.repository.findByDate(projectId, date)) {
      throw new BadRequestException('Эта дата уже отмечена как нерабочая');
    }
    return this.toView(await this.repository.create({
      projectId,
      date,
      label: input.label,
    }));
  }

  async delete(projectId: string, id: string, ownerId: string): Promise<void> {
    await this.findOwnedProject(projectId, ownerId);
    if (!(await this.repository.find(projectId, id))) {
      throw new NotFoundException('Нерабочий день не найден');
    }
    await this.repository.delete(projectId, id);
  }

  private async findOwnedProject(projectId: string, ownerId: string) {
    const project = await this.repository.findOwnedProject(projectId, ownerId);
    if (!project) throw new NotFoundException('Проект не найден');
    return project;
  }

  private parseDateOnly(value: string) {
    return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  }

  private toView(day: {
    id: string;
    projectId: string;
    date: Date;
    label: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): NonWorkingDayView {
    return { ...day, date: day.date.toISOString().slice(0, 10) };
  }
}
