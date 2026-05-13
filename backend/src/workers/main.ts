import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkersModule } from './workers.module';

async function bootstrap() {
  const logger = new Logger('WorkerMain');
  const app = await NestFactory.createApplicationContext(WorkersModule, {
    logger: ['log', 'warn', 'error'],
  });
  logger.log('StoryJump Pipeline Worker started');
  await app.init();
}

bootstrap().catch((err) => {
  console.error('Worker failed to start', err);
  process.exit(1);
});
