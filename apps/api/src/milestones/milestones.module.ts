import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { MilestonesController } from './milestones.controller.js';
import { MilestonesRepository } from './milestones.repository.js';
import { MilestonesService } from './milestones.service.js';

@Module({
  imports: [AuthModule],
  controllers: [MilestonesController],
  providers: [MilestonesRepository, MilestonesService],
})
export class MilestonesModule {}
