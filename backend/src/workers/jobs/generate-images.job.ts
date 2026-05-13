import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ImageProvider } from '../../providers/image/image.provider';
import { TaskStep } from '../../common/enums/task-status.enum';

export interface GenerateImagesJobData {
  taskId: string;
  options?: Record<string, unknown>;
}

export async function handleGenerateImagesJob(
  job: Job<GenerateImagesJobData>,
  prisma: PrismaService,
  imageProvider: ImageProvider,
): Promise<void> {
  const logger = new Logger('GenerateImagesJob');
  const { taskId, options } = job.data;

  logger.log(`Starting generate-images job for task ${taskId}`);

  await prisma.task.update({
    where: { id: taskId },
    data: {
      currentStep: TaskStep.GENERATE_IMAGES,
      progress: 55,
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
      if (!shot.imagePrompt) {
        logger.warn(`Shot ${shot.id} has no imagePrompt, skipping`);
        continue;
      }

      // TODO: 调用图像生成 API
      const imageUrl = await imageProvider.generateImage(shot.imagePrompt, options);

      await prisma.shot.update({
        where: { id: shot.id },
        data: { imageUrl, status: 'image_done' },
      });

      // TODO: 创建 Asset 记录
      await prisma.asset.create({
        data: {
          taskId,
          shotId: shot.id,
          type: 'image',
          url: imageUrl,
          provider: 'flux',
        },
      });

      // 更新进度
      const progress = 55 + Math.round(((i + 1) / total) * 20);
      await prisma.task.update({ where: { id: taskId }, data: { progress } });
      await job.updateProgress(Math.round(((i + 1) / total) * 100));
    }

    logger.log(`Generated images for all ${total} shots in task ${taskId}`);
  } catch (error) {
    logger.error(`Failed to generate images for task ${taskId}`, error);
    throw error;
  }
}
