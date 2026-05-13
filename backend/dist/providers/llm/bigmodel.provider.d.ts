import { ConfigService } from '@nestjs/config';
import { LLMProvider, TaskInput, ShotData, StoryScript, CharacterBible, StoryboardOutput } from './llm.provider';
export declare class BigModelProvider extends LLMProvider {
    private readonly configService;
    private readonly logger;
    private readonly http;
    private readonly model;
    private readonly fallbackApiKey;
    private readonly fallbackBaseUrl;
    private readonly fallbackModel;
    constructor(configService: ConfigService);
    private chat;
    private chatFallback;
    private extractJSON;
    generateStoryboard(input: TaskInput): Promise<StoryboardOutput>;
    generateScript(input: TaskInput): Promise<StoryScript>;
    splitStoryboard(script: StoryScript, input: TaskInput): Promise<ShotData[]>;
    generateImagePrompts(shots: ShotData[], characterBible: CharacterBible[], meta: StoryboardOutput['meta']): Promise<Array<{
        shot_id: number;
        image_prompt: string;
        negative_prompt: string;
    }>>;
}
