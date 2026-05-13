import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LLMProvider } from '../providers/llm/llm.provider';
import { ImageProvider } from '../providers/image/image.provider';
import { TTSProvider } from '../providers/tts/tts.provider';
export declare const STORY_PIPELINE_QUEUE = "story-pipeline";
export declare class PipelineWorker implements OnModuleInit {
    private readonly configService;
    private readonly prisma;
    private readonly llmProvider;
    private readonly imageProvider;
    private readonly ttsProvider;
    private readonly logger;
    private worker;
    private queue;
    constructor(configService: ConfigService, prisma: PrismaService, llmProvider: LLMProvider, imageProvider: ImageProvider, ttsProvider: TTSProvider);
    onModuleInit(): void;
    private processJob;
}
