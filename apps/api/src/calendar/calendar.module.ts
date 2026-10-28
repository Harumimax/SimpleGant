import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { NonWorkingDaysController } from './non-working-days.controller.js';
import { NonWorkingDaysRepository } from './non-working-days.repository.js';
import { NonWorkingDaysService } from './non-working-days.service.js';

@Module({
  imports: [AuthModule],
  controllers: [NonWorkingDaysController],
  providers: [NonWorkingDaysRepository, NonWorkingDaysService],
})
export class CalendarModule {}
