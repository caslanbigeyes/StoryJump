import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersModule } from '../providers/providers.module';
import { PipelineWorker, STORY_PIPELINE_QUEUE } from './pipeline.worker';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
        const url = new URL(redisUrl);
        return {
          redis: { host: url.hostname, port: parseInt(url.port) || 6379 },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: STORY_PIPELINE_QUEUE }),
    ProvidersModule,
  ],
  providers: [PrismaService, PipelineWorker],
})
export class WorkersModule {}
