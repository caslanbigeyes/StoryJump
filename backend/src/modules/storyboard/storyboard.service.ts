import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LLMProvider, LLM_PROVIDER_TOKEN, ShotData, StoryScript, TaskInput } from '../../providers/llm/llm.provider';

@Injectable()
export class StoryboardService {
  private readonly logger = new Logger(StoryboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_PROVIDER_TOKEN) private readonly llmProvider: LLMProvider,
  ) {}

  async splitIntoShots(taskId: string, script: StoryScript, input: TaskInput): Promise<ShotData[]> {
    this.logger.log(`Splitting script into shots for task ${taskId}`);
    return this.llmProvider.splitStoryboard(script, input);
  }

  async updateShot(
    shotId: string,
    data: Partial<{ sceneText: string; cameraAngle: string; characterAction: string; imagePrompt: string }>,
  ) {
    return this.prisma.shot.update({ where: { id: shotId }, data });
  }

  async getShotsByTask(taskId: string) {
    return this.prisma.shot.findMany({ where: { taskId }, orderBy: { shotIndex: 'asc' } });
  }
}
