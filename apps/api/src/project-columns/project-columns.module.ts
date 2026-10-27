import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { ProjectColumnsController } from './project-columns.controller.js';
import { ProjectColumnsRepository } from './project-columns.repository.js';
import { ProjectColumnsService } from './project-columns.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ProjectColumnsController],
  providers: [ProjectColumnsRepository, ProjectColumnsService],
})
export class ProjectColumnsModule {}
