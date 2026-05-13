import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LLMProvider, LLM_PROVIDER_TOKEN, TaskInput, StoryScript, StoryboardOutput } from '../../providers/llm/llm.provider';

@Injectable()
export class ScriptService {
  private readonly logger = new Logger(ScriptService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_PROVIDER_TOKEN) private readonly llmProvider: LLMProvider,
  ) {}

  async generateScript(input: TaskInput): Promise<StoryScript> {
    this.logger.log(`Generating script for: ${input.title}`);
    return this.llmProvider.generateScript(input);
  }

  async rewriteScript(script: StoryScript, instructions?: string): Promise<StoryScript> {
    this.logger.log(`Rewriting script with instructions: ${instructions ?? 'default'}`);
    return {
      ...script,
      narration: `${script.narration}\n\n改写要求：${instructions ?? '优化节奏与表达'}`,
    };
  }

  async getTaskResult(taskId: string): Promise<StoryboardOutput> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { outputJson: true },
    });
    if (!task?.outputJson) {
      throw new NotFoundException(`Task ${taskId} result not found`);
    }
    return JSON.parse(task.outputJson) as StoryboardOutput;
  }

  async updateTaskScript(taskId: string, script: StoryScript): Promise<StoryboardOutput> {
    const result = await this.getTaskResult(taskId);
    const nextResult: StoryboardOutput = {
      ...result,
      script,
    };

    await this.prisma.task.update({
      where: { id: taskId },
      data: { outputJson: JSON.stringify(nextResult) },
    });

    return nextResult;
  }

  async rewriteTaskScript(taskId: string, instructions?: string): Promise<StoryboardOutput> {
    const result = await this.getTaskResult(taskId);
    const rewritten = await this.rewriteScript(result.script, instructions);
    return this.updateTaskScript(taskId, rewritten);
  }
}
