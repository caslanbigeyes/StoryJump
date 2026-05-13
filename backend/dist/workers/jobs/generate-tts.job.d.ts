import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { TTSProvider } from '../../providers/tts/tts.provider';
export interface GenerateTTSJobData {
    taskId: string;
    options?: Record<string, unknown>;
}
export declare function handleGenerateTTSJob(job: Job<GenerateTTSJobData>, prisma: PrismaService, ttsProvider: TTSProvider): Promise<void>;
