import { TTSProvider } from '../../providers/tts/tts.provider';
import { PrismaService } from '../../prisma/prisma.service';
export declare class TtsService {
    private readonly prisma;
    private readonly ttsProvider;
    private readonly logger;
    constructor(prisma: PrismaService, ttsProvider: TTSProvider);
    generateAudioForShot(shotId: string, text: string, options?: Record<string, unknown>): Promise<string>;
    regenerateAudio(shotId: string, options?: Record<string, unknown>): Promise<string>;
    generateAudioForTask(taskId: string, options?: Record<string, unknown>): Promise<{
        total: number;
        successCount: number;
        failedCount: number;
    }>;
}
