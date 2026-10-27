import {
  Body,
  Controller,
  Inject,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import type { PublicUser } from '../auth/auth.types.js';
import { ConfigureProjectColumnsDto } from './project-columns.dto.js';
import { ProjectColumnsService } from './project-columns.service.js';

@Controller('projects/:projectId/columns')
@UseGuards(SessionGuard)
export class ProjectColumnsController {
  constructor(
    @Inject(ProjectColumnsService)
    private readonly service: ProjectColumnsService,
  ) {}

  @Put()
  configure(
    @CurrentUser() user: PublicUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() input: ConfigureProjectColumnsDto,
  ) {
    return this.service.configure(projectId, user.id, input);
  }
}
