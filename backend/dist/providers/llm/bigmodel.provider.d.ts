import { ConfigService } from '@nestjs/config';
import { LLMProvider, TaskInput, ShotData, StoryScript, CharacterBible, StoryboardOutput } from './llm.provider';
export declare class BigModelProvider extends LLMProvider {
    private readonly configService;
    private readonly logger;
    private readonly http;
    private readonly apiKey;
    private readonly model;
    private readonly fallbackApiKey;
    private readonly fallbackBaseUrl;
    private readonly fallbackModel;
    constructor(configService: ConfigService);
    private chat;
    private chatFallback;
    private prepareJSON;
    private extractJSON;
    private extractJSONWithRepair;
    generateStoryboard(input: TaskInput): Promise<StoryboardOutput>;
    private buildCharacterBible;
    private normalizeShots;
    private buildFallbackImagePrompt;
    generateScript(input: TaskInput): Promise<StoryScript>;
    splitStoryboard(script: StoryScript, input: TaskInput): Promise<ShotData[]>;
    private splitStoryboardBatch;
    generateImagePrompts(shots: ShotData[], characterBible: CharacterBible[], meta: StoryboardOutput['meta']): Promise<Array<{
        shot_id: number;
        image_prompt: string;
        negative_prompt: string;
    }>>;
    private generateImagePromptsBatch;
}
