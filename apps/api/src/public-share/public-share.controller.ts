import { Controller, Get, Inject, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { PublicShareService } from './public-share.service.js';

@Controller('public/projects')
export class PublicShareController {
  constructor(
    @Inject(PublicShareService) private readonly service: PublicShareService,
  ) {}

  @Get(':publicToken/gantt')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  get(@Param('publicToken') publicToken: string) {
    return this.service.get(publicToken);
  }
}
