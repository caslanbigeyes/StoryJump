import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { LLMProvider } from '../../providers/llm/llm.provider';
export interface SplitStoryboardJobData {
    taskId: string;
}
export declare function handleSplitStoryboardJob(job: Job<SplitStoryboardJobData>, prisma: PrismaService, _llmProvider: LLMProvider): Promise<void>;
