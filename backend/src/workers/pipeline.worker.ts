import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { Worker, Queue, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LLMProvider, LLM_PROVIDER_TOKEN } from '../providers/llm/llm.provider';
import { ImageProvider, IMAGE_PROVIDER_TOKEN } from '../providers/image/image.provider';
import { TTSProvider, TTS_PROVIDER_TOKEN } from '../providers/tts/tts.provider';
import { TaskStep, TaskStatus } from '../common/enums/task-status.enum';
import { handleCreateScriptJob } from './jobs/create-script.job';
import { handleSplitStoryboardJob } from './jobs/split-storyboard.job';
import { handleGeneratePromptsJob } from './jobs/generate-prompts.job';
import { handleGenerateImagesJob } from './jobs/generate-images.job';
import { handleGenerateTTSJob } from './jobs/generate-tts.job';

export const STORY_PIPELINE_QUEUE = 'story-pipeline';

@Injectable()
export class PipelineWorker implements OnModuleInit {
  private readonly logger = new Logger(PipelineWorker.name);
  private worker: Worker;
  private queue: Queue;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(LLM_PROVIDER_TOKEN) private readonly llmProvider: LLMProvider,
    @Inject(IMAGE_PROVIDER_TOKEN) private readonly imageProvider: ImageProvider,
    @Inject(TTS_PROVIDER_TOKEN) private readonly ttsProvider: TTSProvider,
  ) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    const url = new URL(redisUrl);
    const connection = { host: url.hostname, port: parseInt(url.port) || 6379 };

    // 用于 job handler 内部入队下一步任务
    this.queue = new Queue(STORY_PIPELINE_QUEUE, { connection });

    this.worker = new Worker(
      STORY_PIPELINE_QUEUE,
      async (job: Job) => {
        this.logger.log(`Processing job: ${job.name}, taskId: ${job.data?.taskId}`);
        await this.processJob(job);
      },
      { connection, concurrency: 3 },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} (${job.name}) completed`);
    });

    this.worker.on('failed', async (job, error) => {
      this.logger.error(`Job ${job?.id} (${job?.name}) failed: ${error.message}`);
      if (job?.data?.taskId) {
        await this.prisma.task.update({
          where: { id: job.data.taskId as string },
          data: { status: TaskStatus.FAILED },
        });
      }
    });

    this.logger.log(`Pipeline worker started, queue: ${STORY_PIPELINE_QUEUE}`);
  }

  private async processJob(job: Job): Promise<void> {
    switch (job.name) {
      case TaskStep.CREATE_SCRIPT:
        await handleCreateScriptJob(job, this.prisma, this.llmProvider, this.queue);
        break;
      case TaskStep.SPLIT_STORYBOARD:
        await handleSplitStoryboardJob(job, this.prisma, this.llmProvider);
        break;
      case TaskStep.GENERATE_PROMPTS:
        await handleGeneratePromptsJob(job, this.prisma, this.llmProvider);
        break;
      case TaskStep.GENERATE_IMAGES:
        await handleGenerateImagesJob(job, this.prisma, this.imageProvider);
        break;
      case TaskStep.GENERATE_TTS:
        await handleGenerateTTSJob(job, this.prisma, this.ttsProvider);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
