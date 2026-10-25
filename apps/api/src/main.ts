import 'dotenv/config';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const port = Number(process.env.PORT ?? 3000);

  app.setGlobalPrefix('api');
  app.enableCors({
    credentials: true,
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  });

  await app.listen(port);
}

void bootstrap();
