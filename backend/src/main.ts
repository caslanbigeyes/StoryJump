import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const requestLogger = new Logger('HTTP');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('etag', false);

  app.use('/healthz', (_req, res) => {
    res.status(200).send('ok');
  });

  // 全局前缀
  app.setGlobalPrefix('api');

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // CORS
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      requestLogger.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
    });
    next();
  });

  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/public/',
  });

  const port = process.env.PORT ?? 3000;
  const server = await app.listen(port, '0.0.0.0');
  (globalThis as any).__storyjumpApp = app;
  (globalThis as any).__storyjumpServer = server;
  logger.log(`Application is running on: http://127.0.0.1:${port}/api`);
}

bootstrap();
