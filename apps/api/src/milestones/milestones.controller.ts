import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import type { PublicUser } from '../auth/auth.types.js';
import { CreateMilestoneDto, UpdateMilestoneDto } from './milestones.dto.js';
import { MilestonesService } from './milestones.service.js';

@Controller('projects/:projectId/milestones')
@UseGuards(SessionGuard)
export class MilestonesController {
  constructor(
    @Inject(MilestonesService) private readonly service: MilestonesService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: PublicUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.service.list(projectId, user.id);
  }

  @Post()
  create(
    @CurrentUser() user: PublicUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() input: CreateMilestoneDto,
  ) {
    return this.service.create(projectId, user.id, input);
  }

  @Patch(':milestoneId')
  update(
    @CurrentUser() user: PublicUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
    @Body() input: UpdateMilestoneDto,
  ) {
    return this.service.update(projectId, milestoneId, user.id, input);
  }

  @Delete(':milestoneId')
  @HttpCode(204)
  delete(
    @CurrentUser() user: PublicUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
  ) {
    return this.service.delete(projectId, milestoneId, user.id);
  }
}
