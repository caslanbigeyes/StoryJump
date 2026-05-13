import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskStep } from '../../common/enums/task-status.enum';

const ffmpegPath = require('ffmpeg-static') as string | null;
const execFileAsync = promisify(execFile);

interface ExportVideoOptions {
  resolution?: string;
  format?: string;
}

interface ResolvedSize {
  width: number;
  height: number;
}

interface ActiveExportState {
  status: 'processing' | 'failed';
  progress: number;
  resolution: string;
  format: string;
  errorMessage?: string;
}

@Injectable()
export class VideoService {
  private readonly activeExports = new Map<string, ActiveExportState>();

  constructor(private readonly prisma: PrismaService) {}

  async startTaskVideoExport(taskId: string, options: ExportVideoOptions = {}) {
    const resolution = options.resolution ?? '1080x1920';
    const format = (options.format ?? 'mp4').toLowerCase();

    const existing = this.activeExports.get(taskId);
    if (existing?.status === 'processing') {
      return {
        status: 'processing' as const,
        progress: existing.progress,
        resolution: existing.resolution,
        format: existing.format.toUpperCase(),
        videoUrl: null,
      };
    }

    this.activeExports.set(taskId, {
      status: 'processing',
      progress: 5,
      resolution,
      format,
    });

    void this.exportTaskVideo(taskId, { resolution, format }).catch((error) => {
      const current = this.activeExports.get(taskId);
      if (!current) return;
      this.activeExports.set(taskId, {
        ...current,
        status: 'failed',
        progress: 100,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      setTimeout(() => {
        const latest = this.activeExports.get(taskId);
        if (latest?.status === 'failed') {
          this.activeExports.delete(taskId);
        }
      }, 30000);
    });

    return {
      status: 'processing' as const,
      progress: 5,
      resolution,
      format: format.toUpperCase(),
      videoUrl: null,
    };
  }

  private async exportTaskVideo(taskId: string, options: ExportVideoOptions = {}) {
    if (!ffmpegPath) {
      throw new Error('ffmpeg binary is not available');
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        shots: {
          orderBy: { shotIndex: 'asc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    const readyShots = task.shots.filter((shot) => Boolean(shot.imageUrl));
    if (readyShots.length === 0) {
      throw new Error('No generated images found for this task');
    }

    const readyAudio = readyShots.filter((shot) => Boolean(shot.audioUrl));
    const resolution = options.resolution ?? '1080x1920';
    const format = (options.format ?? 'mp4').toLowerCase();
    const { width, height } = this.parseResolution(resolution);
    const exportId = `${taskId}-${Date.now()}`;
    const workDir = join(process.cwd(), 'tmp', 'video-renders', exportId);
    const outputDir = join(process.cwd(), 'public', 'videos', taskId);
    const outputFilename = `${exportId}.${format}`;
    const outputPath = join(outputDir, outputFilename);

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        currentStep: TaskStep.GENERATE_VIDEO,
        progress: 90,
        errorMessage: null,
      },
    });

    this.activeExports.set(taskId, {
      status: 'processing',
      progress: 10,
      resolution,
      format,
    });

    try {
      await mkdir(workDir, { recursive: true });
      await mkdir(outputDir, { recursive: true });

      const segmentPaths: string[] = [];

      for (const [index, shot] of readyShots.entries()) {
        const imagePath = join(workDir, `shot-${index.toString().padStart(3, '0')}.jpg`);
        const audioPath = shot.audioUrl
          ? join(workDir, `shot-${index.toString().padStart(3, '0')}.mp3`)
          : null;
        const segmentPath = join(workDir, `segment-${index.toString().padStart(3, '0')}.mp4`);

        await this.downloadToFile(shot.imageUrl!, imagePath);
        if (audioPath && shot.audioUrl) {
          await this.downloadToFile(shot.audioUrl, audioPath);
        }

        await this.renderSegment({
          imagePath,
          audioPath,
          segmentPath,
          width,
          height,
        });

        segmentPaths.push(segmentPath);

        const progress = 10 + Math.round(((index + 1) / readyShots.length) * 70);
        this.activeExports.set(taskId, {
          status: 'processing',
          progress,
          resolution,
          format,
        });
        await this.prisma.task.update({
          where: { id: taskId },
          data: {
            currentStep: TaskStep.GENERATE_VIDEO,
            progress: Math.min(98, progress),
          },
        });
      }

      const concatFilePath = join(workDir, 'concat.txt');
      await writeFile(
        concatFilePath,
        segmentPaths.map((segmentPath) => `file '${segmentPath.replace(/'/g, "'\\''")}'`).join('\n'),
        'utf8',
      );

      await execFileAsync(ffmpegPath, [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        concatFilePath,
        '-c',
        'copy',
        outputPath,
      ]);

      this.activeExports.set(taskId, {
        status: 'processing',
        progress: 95,
        resolution,
        format,
      });

      const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? `http://127.0.0.1:${process.env.PORT ?? 3000}`;
      const relativeUrl = `/public/videos/${taskId}/${outputFilename}`;
      const videoUrl = `${publicBaseUrl}${relativeUrl}`;

      const asset = await this.prisma.asset.create({
        data: {
          taskId,
          type: 'video',
          url: videoUrl,
          provider: `storyjump-ffmpeg:${resolution}:${format}:${readyAudio.length > 0 ? 'with-audio' : 'mute'}`,
        },
      });

      await this.prisma.task.update({
        where: { id: taskId },
        data: {
          currentStep: TaskStep.DONE,
          progress: 100,
        },
      });

      await rm(workDir, { recursive: true, force: true });
      this.activeExports.delete(taskId);

      return {
        assetId: asset.id,
        videoUrl: asset.url,
        resolution,
        format: format.toUpperCase(),
        shotCount: readyShots.length,
        audioCount: readyAudio.length,
        provider: asset.provider,
      };
    } catch (error) {
      await rm(workDir, { recursive: true, force: true });
      await this.prisma.task.update({
        where: { id: taskId },
        data: {
          errorMessage: error instanceof Error ? error.message : String(error),
          currentStep: TaskStep.DONE,
          progress: 100,
        },
      });
      throw error;
    }
  }

  async getTaskVideo(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, currentStep: true, progress: true, errorMessage: true },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    const activeExport = this.activeExports.get(taskId);
    if (activeExport) {
      if (activeExport.status === 'failed') {
        return {
          status: 'failed' as const,
          videoUrl: null,
          progress: activeExport.progress,
          resolution: activeExport.resolution,
          format: activeExport.format.toUpperCase(),
          errorMessage: activeExport.errorMessage ?? task.errorMessage ?? '视频导出失败',
        };
      }

      return {
        status: 'processing' as const,
        videoUrl: null,
        progress: activeExport.progress,
        resolution: activeExport.resolution,
        format: activeExport.format.toUpperCase(),
      };
    }

    const asset = await this.prisma.asset.findFirst({
      where: { taskId, type: 'video' },
      orderBy: { id: 'desc' },
    });

    if (!asset) {
      if (task.currentStep === TaskStep.GENERATE_VIDEO) {
        return {
          status: 'processing' as const,
          videoUrl: null,
          progress: task.progress,
        };
      }
      if (task.errorMessage) {
        return {
          status: 'failed' as const,
          videoUrl: null,
          progress: task.progress,
          errorMessage: task.errorMessage,
        };
      }
      return {
        status: 'idle' as const,
        videoUrl: null,
      };
    }

    const [, resolution = '1080x1920', format = 'mp4', audioMode = 'mute'] = asset.provider.split(':');

    return {
      status: 'ready',
      videoUrl: asset.url,
      assetId: asset.id,
      resolution,
      format: format.toUpperCase(),
      audioMode,
      provider: asset.provider,
    };
  }

  private parseResolution(resolution: string): ResolvedSize {
    const [widthRaw, heightRaw] = resolution.split('x');
    const width = Number(widthRaw);
    const height = Number(heightRaw);

    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return { width: 1080, height: 1920 };
    }

    return { width, height };
  }

  private async downloadToFile(url: string, filePath: string) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download asset: ${url}`);
    }

    await mkdir(dirname(filePath), { recursive: true });
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(filePath, buffer);
  }

  private async renderSegment(params: {
    imagePath: string;
    audioPath: string | null;
    segmentPath: string;
    width: number;
    height: number;
  }) {
    const { imagePath, audioPath, segmentPath, width, height } = params;
    const scaleFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,format=yuv420p`;
    const args = audioPath
      ? [
          '-y',
          '-loop',
          '1',
          '-i',
          imagePath,
          '-i',
          audioPath,
          '-t',
          '3',
          '-vf',
          scaleFilter,
          '-r',
          '24',
          '-c:v',
          'libx264',
          '-c:a',
          'aac',
          '-shortest',
          segmentPath,
        ]
      : [
          '-y',
          '-loop',
          '1',
          '-i',
          imagePath,
          '-f',
          'lavfi',
          '-i',
          'anullsrc=channel_layout=stereo:sample_rate=44100',
          '-t',
          '3',
          '-vf',
          scaleFilter,
          '-r',
          '24',
          '-c:v',
          'libx264',
          '-c:a',
          'aac',
          '-shortest',
          segmentPath,
        ];

    await execFileAsync(ffmpegPath!, args);
  }
}
