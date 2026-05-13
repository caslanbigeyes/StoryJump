import { PrismaService } from '../../prisma/prisma.service';
import { LLMProvider, TaskInput, StoryScript, StoryboardOutput } from '../../providers/llm/llm.provider';
export declare class ScriptService {
    private readonly prisma;
    private readonly llmProvider;
    private readonly logger;
    constructor(prisma: PrismaService, llmProvider: LLMProvider);
    generateScript(input: TaskInput): Promise<StoryScript>;
    rewriteScript(script: StoryScript, instructions?: string): Promise<StoryScript>;
    getTaskResult(taskId: string): Promise<StoryboardOutput>;
    updateTaskScript(taskId: string, script: StoryScript): Promise<StoryboardOutput>;
    rewriteTaskScript(taskId: string, instructions?: string): Promise<StoryboardOutput>;
}
