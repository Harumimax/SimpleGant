import { Module } from '@nestjs/common';

import { PublicShareController } from './public-share.controller.js';
import { PublicShareRepository } from './public-share.repository.js';
import { PublicShareService } from './public-share.service.js';

@Module({
  controllers: [PublicShareController],
  providers: [PublicShareRepository, PublicShareService],
})
export class PublicShareModule {}
