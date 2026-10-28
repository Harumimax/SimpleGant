import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import type { PublicUser } from '../auth/auth.types.js';
import { UpdateGanttDto } from './gantt.dto.js';
import { GanttService } from './gantt.service.js';

@Controller('projects/:projectId/gantt')
@UseGuards(SessionGuard)
export class GanttController {
  constructor(@Inject(GanttService) private readonly service: GanttService) {}

  @Get()
  get(
    @CurrentUser() user: PublicUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.service.get(projectId, user.id);
  }

  @Put()
  update(
    @CurrentUser() user: PublicUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() input: UpdateGanttDto,
  ) {
    return this.service.update(projectId, user.id, input);
  }
}
