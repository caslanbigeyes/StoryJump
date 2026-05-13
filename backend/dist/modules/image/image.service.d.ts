import { ImageProvider } from '../../providers/image/image.provider';
import { PrismaService } from '../../prisma/prisma.service';
export declare class ImageService {
    private readonly prisma;
    private readonly imageProvider;
    private readonly logger;
    constructor(prisma: PrismaService, imageProvider: ImageProvider);
    generateImageForShot(shotId: string, prompt: string, options?: Record<string, unknown>): Promise<string>;
    regenerateImage(shotId: string, options?: Record<string, unknown>): Promise<string>;
}
