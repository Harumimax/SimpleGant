import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CalendarModule } from './calendar/calendar.module.js';
import { DatabaseModule } from './database/database.module.js';
import { MilestonesModule } from './milestones/milestones.module.js';
import { ProjectColumnsModule } from './project-columns/project-columns.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { CsrfOriginGuard } from './security/csrf-origin.guard.js';
import { TasksModule } from './tasks/tasks.module.js';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CalendarModule,
    MilestonesModule,
    ProjectsModule,
    ProjectColumnsModule,
    TasksModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: CsrfOriginGuard },
  ],
})
export class AppModule {}
