import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { LLMProvider, TaskInput } from '../../providers/llm/llm.provider';
export interface CreateScriptJobData {
    taskId: string;
    input: TaskInput;
}
export declare function handleCreateScriptJob(job: Job<CreateScriptJobData>, prisma: PrismaService, llmProvider: LLMProvider): Promise<void>;
