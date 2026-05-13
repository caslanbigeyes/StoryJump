import { Injectable, Logger } from '@nestjs/common';
import { ImageProvider } from '../../providers/image/image.provider';
import { PrismaService } from '../../prisma/prisma.service';

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
      data: { imageUrl },
    });

    return imageUrl;
  }

  async regenerateImage(shotId: string, options?: Record<string, unknown>): Promise<string> {
    // TODO: 重新生成分镜图片（用于用户手动重试）
    const shot = await this.prisma.shot.findUnique({ where: { id: shotId } });
    if (!shot?.imagePrompt) throw new Error(`Shot ${shotId} has no image prompt`);
    return this.generateImageForShot(shotId, shot.imagePrompt, options);
  }
}
