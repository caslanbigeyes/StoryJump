import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ImageProvider } from '../../providers/image/image.provider';
import { TaskStatus, TaskStep } from '../../common/enums/task-status.enum';

export interface GenerateImagesJobData {
  taskId: string;
  options?: {
    aspect_ratio?: string;
    quality?: string;
    [key: string]: unknown;
  };
}

/** 每批并发生图数量（防止 OpenAI rate limit） */
const BATCH_SIZE = 2;

export async function handleGenerateImagesJob(
  job: Job<GenerateImagesJobData>,
  prisma: PrismaService,
  imageProvider: ImageProvider,
  queue?: Queue,
): Promise<void> {
  const logger = new Logger('GenerateImagesJob');
  const { taskId, options } = job.data;

  logger.log(`[task:${taskId}] start generate-images`);

  await prisma.task.update({
    where: { id: taskId },
    data: { currentStep: TaskStep.GENERATE_IMAGES, progress: 60 },
  });

  try {
    const shots = await prisma.shot.findMany({
      where: { taskId },
      orderBy: { shotIndex: 'asc' },
    });

    const total = shots.length;
    if (total === 0) {
      logger.warn(`[task:${taskId}] no shots found, marking done`);
      await prisma.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.SUCCESS, currentStep: TaskStep.DONE, progress: 100 },
      });
      return;
    }

    logger.log(`[task:${taskId}] generating images for ${total} shots`);
    let completed = 0;

    // 分批串行（每批内部并行）避免超限
    for (let batchStart = 0; batchStart < total; batchStart += BATCH_SIZE) {
      const batch = shots.slice(batchStart, batchStart + BATCH_SIZE);

      await Promise.all(
        batch.map(async (shot) => {
          if (!shot.imagePrompt) {
            logger.warn(`[task:${taskId}] shot ${shot.shotIndex} has no imagePrompt, skipping`);
            completed++;
            return;
          }

          try {
            const imageUrl = await imageProvider.generateImage(shot.imagePrompt, options);

            await prisma.shot.update({
              where: { id: shot.id },
              data: { imageUrl, status: 'image_done' },
            });

            await prisma.asset.create({
              data: {
                taskId,
                shotId: shot.id,
                type: 'image',
                url: imageUrl,
                provider: 'kling',
              },
            });

            logger.log(`[task:${taskId}] shot ${shot.shotIndex}/${total} image done`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logger.error(`[task:${taskId}] shot ${shot.shotIndex} image failed: ${msg}`);
            await prisma.shot.update({
              where: { id: shot.id },
              data: { status: 'image_failed' },
            });
          }

          completed++;
        }),
      );

      // 更新整体进度 (60% ~ 95%)
      const progress = 60 + Math.round((completed / total) * 35);
      await prisma.task.update({ where: { id: taskId }, data: { progress } });
      await job.updateProgress(Math.round((completed / total) * 100));
    }

    // 统计结果
    const failedCount = await prisma.shot.count({
      where: { taskId, status: 'image_failed' },
    });
    const successCount = await prisma.shot.count({
      where: { taskId, status: 'image_done' },
    });

    logger.log(`[task:${taskId}] generate-images done: success=${successCount}, failed=${failedCount}`);

    if (queue && successCount > 0) {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          currentStep: TaskStep.GENERATE_TTS,
          progress: 75,
          ...(failedCount > 0 && {
            errorMessage: `${failedCount}/${total} shots failed to generate image`,
          }),
        },
      });

      await queue.add(
        TaskStep.GENERATE_TTS,
        { taskId },
        { attempts: 2, backoff: { type: 'exponential', delay: 5000 } },
      );
      return;
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.SUCCESS,
        currentStep: TaskStep.DONE,
        progress: 100,
        ...(failedCount > 0 && {
          errorMessage: `${failedCount}/${total} shots failed to generate image`,
        }),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`[task:${taskId}] generate-images fatal: ${msg}`);
    await prisma.task.update({
      where: { id: taskId },
      data: { status: TaskStatus.FAILED, errorMessage: msg },
    });
    throw error;
  }
}
