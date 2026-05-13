import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { TTSProvider } from '../../providers/tts/tts.provider';
import { TaskStatus, TaskStep } from '../../common/enums/task-status.enum';

export interface GenerateTTSJobData {
  taskId: string;
  options?: Record<string, unknown>;
}

export async function handleGenerateTTSJob(
  job: Job<GenerateTTSJobData>,
  prisma: PrismaService,
  ttsProvider: TTSProvider,
): Promise<void> {
  const logger = new Logger('GenerateTTSJob');
  const { taskId, options } = job.data;

  logger.log(`Starting generate-tts job for task ${taskId}`);

  await prisma.task.update({
    where: { id: taskId },
    data: {
      currentStep: TaskStep.GENERATE_TTS,
      progress: 75,
    },
  });

  try {
    const shots = await prisma.shot.findMany({
      where: { taskId },
      orderBy: { shotIndex: 'asc' },
    });

    const total = shots.length;
    for (let i = 0; i < total; i++) {
      const shot = shots[i];
      if (!shot.sceneText) {
        logger.warn(`Shot ${shot.id} has no sceneText, skipping TTS`);
        continue;
      }

      // TODO: 调用 TTS 服务生成音频
      const audioUrl = await ttsProvider.generateVoice(shot.sceneText, options);

      await prisma.shot.update({
        where: { id: shot.id },
        data: { audioUrl, status: 'tts_done' },
      });

      // TODO: 创建 Asset 记录
      await prisma.asset.create({
        data: {
          taskId,
          shotId: shot.id,
          type: 'audio',
          url: audioUrl,
          provider: 'volcano',
        },
      });

      const progress = 75 + Math.round(((i + 1) / total) * 20);
      await prisma.task.update({ where: { id: taskId }, data: { progress } });
      await job.updateProgress(Math.round(((i + 1) / total) * 100));
    }

    // 所有步骤完成，标记任务为成功
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.SUCCESS,
        currentStep: TaskStep.DONE,
        progress: 100,
      },
    });

    logger.log(`TTS generation completed for task ${taskId}`);
  } catch (error) {
    logger.error(`Failed to generate TTS for task ${taskId}`, error);
    throw error;
  }
}
