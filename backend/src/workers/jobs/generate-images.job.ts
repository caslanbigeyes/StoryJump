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

    // 读取已有角色锚（断点续跑场景）
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    let characterRef: string | null = task?.characterReferenceUrl ?? null;

    const renderShot = async (shot: typeof shots[number]): Promise<void> => {
      if (!shot.imagePrompt) {
        logger.warn(`[task:${taskId}] shot ${shot.shotIndex} has no imagePrompt, skipping`);
        completed++;
        return;
      }

      try {
        const shotOptions: Record<string, unknown> = { ...(options ?? {}) };
        if (characterRef) {
          shotOptions.referenceImageUrl = characterRef;
          // 0.5 在风格保持和构图自由度之间折中；后续可调
          shotOptions.referenceStrength = 0.5;
        }

        const imageUrl = await imageProvider.generateImage(shot.imagePrompt, shotOptions);

        await prisma.shot.update({
          where: { id: shot.id },
          data: {
            imageUrl,
            status: 'image_done',
            referenceImageUrl: characterRef ?? null,
          },
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

        logger.log(`[task:${taskId}] shot ${shot.shotIndex}/${total} image done (ref=${characterRef ? 'yes' : 'no'})`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`[task:${taskId}] shot ${shot.shotIndex} image failed: ${msg}`);
        await prisma.shot.update({
          where: { id: shot.id },
          data: { status: 'image_failed' },
        });
      }

      completed++;
    };

    // 阶段 1: 若无角色锚，单跑首镜，回写 task.characterReferenceUrl
    let startIndex = 0;
    if (!characterRef) {
      const firstShot = shots[0];
      await renderShot(firstShot);
      const refreshed = await prisma.shot.findUnique({ where: { id: firstShot.id } });
      if (refreshed?.imageUrl) {
        characterRef = refreshed.imageUrl;
        await prisma.task.update({
          where: { id: taskId },
          data: { characterReferenceUrl: characterRef },
        });
        logger.log(`[task:${taskId}] character reference anchored at shot 0`);
      } else {
        logger.warn(`[task:${taskId}] first shot failed to produce reference image, continuing without anchor`);
      }
      startIndex = 1;
      const progress = 60 + Math.round((completed / total) * 35);
      await prisma.task.update({ where: { id: taskId }, data: { progress } });
      await job.updateProgress(Math.round((completed / total) * 100));
    }

    // 阶段 2: 剩余镜头分批并发，带参考图
    for (let batchStart = startIndex; batchStart < total; batchStart += BATCH_SIZE) {
      const batch = shots.slice(batchStart, batchStart + BATCH_SIZE);
      await Promise.all(batch.map(renderShot));

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
