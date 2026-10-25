import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      service: 'simplegant-api',
      status: 'ok',
    } as const;
  }
}
