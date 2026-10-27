import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  DEFAULT_MILESTONE_COLOR,
  type MilestoneColor,
} from './milestone.constants.js';
import type { CreateMilestoneDto, UpdateMilestoneDto } from './milestones.dto.js';
import { MilestonesRepository } from './milestones.repository.js';
import type { MilestoneView } from './milestone.types.js';

@Injectable()
export class MilestonesService {
  constructor(
    @Inject(MilestonesRepository)
    private readonly repository: MilestonesRepository,
  ) {}

  async list(projectId: string, ownerId: string): Promise<MilestoneView[]> {
    await this.findOwnedProject(projectId, ownerId);
    return (await this.repository.list(projectId)).map((milestone) =>
      this.toView(milestone),
    );
  }

  async create(
    projectId: string,
    ownerId: string,
    input: CreateMilestoneDto,
  ): Promise<MilestoneView> {
    const project = await this.findOwnedProject(projectId, ownerId);
    const date = this.parseDate(input.date);
    this.validateProjectRange(date, project.startDate, project.endDate);
    return this.toView(await this.repository.create({
      projectId,
      title: input.title,
      date,
      color: input.color ?? DEFAULT_MILESTONE_COLOR,
    }));
  }

  async update(
    projectId: string,
    milestoneId: string,
    ownerId: string,
    input: UpdateMilestoneDto,
  ): Promise<MilestoneView> {
    const project = await this.findOwnedProject(projectId, ownerId);
    const current = await this.repository.find(projectId, milestoneId);
    if (!current) throw new NotFoundException('Веха не найдена');
    const date = input.date ? this.parseDate(input.date) : current.date;
    this.validateProjectRange(date, project.startDate, project.endDate);
    return this.toView(await this.repository.update(milestoneId, {
      title: input.title ?? current.title,
      date,
      color: input.color ?? current.color as MilestoneColor,
    }));
  }

  async delete(projectId: string, milestoneId: string, ownerId: string) {
    await this.findOwnedProject(projectId, ownerId);
    if (!(await this.repository.delete(projectId, milestoneId))) {
      throw new NotFoundException('Веха не найдена');
    }
  }

  private async findOwnedProject(projectId: string, ownerId: string) {
    const project = await this.repository.findOwnedProject(projectId, ownerId);
    if (!project) throw new NotFoundException('Проект не найден');
    return project;
  }

  private parseDate(value: string) {
    return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  }

  private validateProjectRange(date: Date, startDate: Date, endDate: Date) {
    if (date < startDate || date > endDate) {
      throw new BadRequestException('Дата вехи должна входить в период проекта');
    }
  }

  private toView(milestone: {
    id: string;
    projectId: string;
    title: string;
    date: Date;
    color: string;
    createdAt: Date;
    updatedAt: Date;
  }): MilestoneView {
    return {
      ...milestone,
      date: milestone.date.toISOString().slice(0, 10),
      color: milestone.color as MilestoneColor,
    };
  }
}
