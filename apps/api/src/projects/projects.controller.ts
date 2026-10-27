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
import { CreateProjectDto, UpdateProjectDto } from './projects.dto.js';
import { ProjectsService } from './projects.service.js';

@Controller('projects')
@UseGuards(SessionGuard)
export class ProjectsController {
  constructor(
    @Inject(ProjectsService) private readonly projectsService: ProjectsService,
  ) {}

  @Get()
  list(@CurrentUser() user: PublicUser) {
    return this.projectsService.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: PublicUser, @Body() input: CreateProjectDto) {
    return this.projectsService.create(user.id, input);
  }

  @Get(':id')
  get(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projectsService.get(id, user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, user.id, input);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projectsService.delete(id, user.id);
  }
}
