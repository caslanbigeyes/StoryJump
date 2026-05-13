import { Injectable, Inject, Logger } from '@nestjs/common';
import { LLMProvider, LLM_PROVIDER_TOKEN, TaskInput, StoryScript } from '../../providers/llm/llm.provider';

@Injectable()
export class ScriptService {
  private readonly logger = new Logger(ScriptService.name);

  constructor(
    @Inject(LLM_PROVIDER_TOKEN) private readonly llmProvider: LLMProvider,
  ) {}

  async generateScript(input: TaskInput): Promise<StoryScript> {
    this.logger.log(`Generating script for: ${input.title}`);
    return this.llmProvider.generateScript(input);
  }

  async rewriteScript(script: StoryScript, instructions?: string): Promise<StoryScript> {
    // TODO: 调用 LLM 对剧本进行智能改写
    this.logger.log(`Rewriting script with instructions: ${instructions ?? 'default'}`);
    return script;
  }
}
