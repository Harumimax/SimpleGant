import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { GanttController } from './gantt.controller.js';
import { GanttRepository } from './gantt.repository.js';
import { GanttService } from './gantt.service.js';

@Module({
  imports: [AuthModule],
  controllers: [GanttController],
  providers: [GanttRepository, GanttService],
})
export class GanttModule {}
