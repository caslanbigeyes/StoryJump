import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { STORY_PIPELINE_QUEUE } from '../../workers/pipeline.worker';
import { ScriptModule } from '../script/script.module';
import { StoryboardModule } from '../storyboard/storyboard.module';
import { ImageModule } from '../image/image.module';
import { TtsModule } from '../tts/tts.module';
import { VideoModule } from '../video/video.module';

@Module({
  imports: [
    AuthModule,
    ScriptModule,
    StoryboardModule,
    ImageModule,
    TtsModule,
    VideoModule,
    BullModule.registerQueue({ name: STORY_PIPELINE_QUEUE }),
  ],
  controllers: [TaskController],
  providers: [TaskService, PrismaService],
  exports: [TaskService],
})
export class TaskModule {}
