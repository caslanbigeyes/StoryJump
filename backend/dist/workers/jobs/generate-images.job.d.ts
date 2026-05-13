import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ImageProvider } from '../../providers/image/image.provider';
export interface GenerateImagesJobData {
    taskId: string;
    options?: {
        aspect_ratio?: string;
        quality?: string;
        [key: string]: unknown;
    };
}
export declare function handleGenerateImagesJob(job: Job<GenerateImagesJobData>, prisma: PrismaService, imageProvider: ImageProvider): Promise<void>;
