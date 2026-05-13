import { Injectable, Logger } from '@nestjs/common';
import { ImageProvider } from '../../providers/image/image.provider';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskStep } from '../../common/enums/task-status.enum';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imageProvider: ImageProvider,
  ) {}

  async generateImageForShot(
    shotId: string,
    prompt: string,
    options?: Record<string, unknown>,
  ): Promise<string> {
    this.logger.log(`Generating image for shot ${shotId}`);
    // TODO: 调用图像生成服务
    const imageUrl = await this.imageProvider.generateImage(prompt, options);

    await this.prisma.shot.update({
      where: { id: shotId },
      data: { imageUrl, status: 'image_done' },
    });

    return imageUrl;
  }

  async regenerateImage(shotId: string, options?: Record<string, unknown>): Promise<string> {
    const shot = await this.prisma.shot.findUnique({ where: { id: shotId } });
    if (!shot?.imagePrompt) throw new Error(`Shot ${shotId} has no image prompt`);
    return this.generateImageForShot(shotId, shot.imagePrompt, options);
  }

  async generateImagesForTask(taskId: string, options?: Record<string, unknown>) {
    const shots = await this.prisma.shot.findMany({
      where: { taskId },
      orderBy: { shotIndex: 'asc' },
    });

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        currentStep: TaskStep.GENERATE_IMAGES,
        progress: 60,
        errorMessage: null,
      },
    });

    let successCount = 0;
    let failedCount = 0;

    for (const shot of shots) {
      if (!shot.imagePrompt) {
        failedCount++;
        await this.prisma.shot.update({
          where: { id: shot.id },
          data: { status: 'image_failed' },
        });
        continue;
      }

      try {
        await this.generateImageForShot(shot.id, shot.imagePrompt, options);
        successCount++;
      } catch (error) {
        failedCount++;
        this.logger.error(
          `Batch image generation failed for shot ${shot.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
        await this.prisma.shot.update({
          where: { id: shot.id },
          data: { status: 'image_failed' },
        });
      }
    }

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        currentStep: TaskStep.DONE,
        progress: 100,
        ...(failedCount > 0 ? { errorMessage: `${failedCount}/${shots.length} shots failed to generate image` } : {}),
      },
    });

    return {
      total: shots.length,
      successCount,
      failedCount,
    };
  }
}
