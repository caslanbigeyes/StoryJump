import { Injectable, Logger } from '@nestjs/common';
import { TTSProvider } from '../../providers/tts/tts.provider';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ttsProvider: TTSProvider,
  ) {}

  async generateAudioForShot(
    shotId: string,
    text: string,
    options?: Record<string, unknown>,
  ): Promise<string> {
    this.logger.log(`Generating TTS audio for shot ${shotId}`);
    // TODO: 调用 TTS 服务
    const audioUrl = await this.ttsProvider.generateVoice(text, options);

    await this.prisma.shot.update({
      where: { id: shotId },
      data: { audioUrl },
    });

    return audioUrl;
  }

  async regenerateAudio(shotId: string, options?: Record<string, unknown>): Promise<string> {
    // TODO: 重新生成分镜配音
    const shot = await this.prisma.shot.findUnique({ where: { id: shotId } });
    if (!shot?.sceneText) throw new Error(`Shot ${shotId} has no scene text`);
    return this.generateAudioForShot(shotId, shot.sceneText, options);
  }
}
