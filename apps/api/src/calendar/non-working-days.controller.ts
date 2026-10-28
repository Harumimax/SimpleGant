import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import type { PublicUser } from '../auth/auth.types.js';
import { CreateNonWorkingDayDto } from './non-working-days.dto.js';
import { NonWorkingDaysService } from './non-working-days.service.js';

@Controller('projects/:projectId/non-working-days')
@UseGuards(SessionGuard)
export class NonWorkingDaysController {
  constructor(
    @Inject(NonWorkingDaysService) private readonly service: NonWorkingDaysService,
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
    @Body() input: CreateNonWorkingDayDto,
  ) {
    return this.service.create(projectId, user.id, input);
  }

  @Delete(':dayId')
  @HttpCode(204)
  delete(
    @CurrentUser() user: PublicUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('dayId', ParseUUIDPipe) dayId: string,
  ) {
    return this.service.delete(projectId, dayId, user.id);
  }
}
