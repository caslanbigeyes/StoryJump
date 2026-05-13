import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ImageProvider } from '../../providers/image/image.provider';
export interface GenerateImagesJobData {
    taskId: string;
    options?: Record<string, unknown>;
}
export declare function handleGenerateImagesJob(job: Job<GenerateImagesJobData>, prisma: PrismaService, imageProvider: ImageProvider): Promise<void>;
