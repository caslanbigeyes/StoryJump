import { Injectable, Logger } from '@nestjs/common';
import { TTSProvider } from '../../providers/tts/tts.provider';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskStep } from '../../common/enums/task-status.enum';

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
      data: { audioUrl, status: 'tts_done' },
    });

    return audioUrl;
  }

  async regenerateAudio(shotId: string, options?: Record<string, unknown>): Promise<string> {
    const shot = await this.prisma.shot.findUnique({ where: { id: shotId } });
    if (!shot?.sceneText) throw new Error(`Shot ${shotId} has no scene text`);
    return this.generateAudioForShot(shotId, shot.sceneText, options);
  }

  async generateAudioForTask(taskId: string, options?: Record<string, unknown>) {
    const shots = await this.prisma.shot.findMany({
      where: { taskId },
      orderBy: { shotIndex: 'asc' },
    });

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        currentStep: TaskStep.GENERATE_TTS,
        progress: 85,
        errorMessage: null,
      },
    });

    let successCount = 0;
    let failedCount = 0;

    for (const shot of shots) {
      if (!shot.sceneText) {
        failedCount++;
        await this.prisma.shot.update({
          where: { id: shot.id },
          data: { status: 'tts_failed' },
        });
        continue;
      }

      try {
        await this.generateAudioForShot(shot.id, shot.sceneText, options);
        successCount++;
      } catch (error) {
        failedCount++;
        this.logger.error(
          `Batch audio generation failed for shot ${shot.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
        await this.prisma.shot.update({
          where: { id: shot.id },
          data: { status: 'tts_failed' },
        });
      }
    }

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        currentStep: TaskStep.DONE,
        progress: 100,
        ...(failedCount > 0 ? { errorMessage: `${failedCount}/${shots.length} shots failed to generate audio` } : {}),
      },
    });

    return {
      total: shots.length,
      successCount,
      failedCount,
    };
  }
}
