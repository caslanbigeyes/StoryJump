import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { STORY_PIPELINE_QUEUE } from '../../workers/pipeline.worker';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({ name: STORY_PIPELINE_QUEUE }),
  ],
  controllers: [TaskController],
  providers: [TaskService, PrismaService],
  exports: [TaskService],
})
export class TaskModule {}
