import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { LLMProvider } from '../../providers/llm/llm.provider';
export interface GeneratePromptsJobData {
    taskId: string;
}
export declare function handleGeneratePromptsJob(job: Job<GeneratePromptsJobData>, prisma: PrismaService, llmProvider: LLMProvider): Promise<void>;
