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
  Put,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import type { PublicUser } from '../auth/auth.types.js';
import {
  CreateTaskDto,
  ReorderTasksDto,
  UpdateTaskDto,
} from './tasks.dto.js';
import { TasksService } from './tasks.service.js';

@Controller('projects/:projectId/tasks')
@UseGuards(SessionGuard)
export class TasksController {
  constructor(@Inject(TasksService) private readonly tasksService: TasksService) {}

  @Get()
  list(
    @CurrentUser() user: PublicUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.tasksService.list(projectId, user.id);
  }

  @Post()
  create(
    @CurrentUser() user: PublicUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() input: CreateTaskDto,
  ) {
    return this.tasksService.create(projectId, user.id, input);
  }

  @Put('order')
  reorder(
    @CurrentUser() user: PublicUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() input: ReorderTasksDto,
  ) {
    return this.tasksService.reorder(projectId, user.id, input);
  }

  @Get(':taskId')
  get(
    @CurrentUser() user: PublicUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.tasksService.get(projectId, taskId, user.id);
  }

  @Patch(':taskId')
  update(
    @CurrentUser() user: PublicUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() input: UpdateTaskDto,
  ) {
    return this.tasksService.update(projectId, taskId, user.id, input);
  }

  @Delete(':taskId')
  @HttpCode(204)
  delete(
    @CurrentUser() user: PublicUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.tasksService.delete(projectId, taskId, user.id);
  }
}
