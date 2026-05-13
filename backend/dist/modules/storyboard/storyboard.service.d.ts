import { PrismaService } from '../../prisma/prisma.service';
import { LLMProvider, ShotData, StoryScript, TaskInput } from '../../providers/llm/llm.provider';
export declare class StoryboardService {
    private readonly prisma;
    private readonly llmProvider;
    private readonly logger;
    constructor(prisma: PrismaService, llmProvider: LLMProvider);
    splitIntoShots(taskId: string, script: StoryScript, input: TaskInput): Promise<ShotData[]>;
    updateShot(shotId: string, data: Partial<{
        sceneText: string;
        cameraAngle: string;
        characterAction: string;
        imagePrompt: string;
    }>): Promise<{
        id: string;
        taskId: string;
        shotIndex: number;
        sceneText: string | null;
        cameraAngle: string | null;
        characterAction: string | null;
        imagePrompt: string | null;
        imageUrl: string | null;
        audioUrl: string | null;
        status: string;
    }>;
    getShotsByTask(taskId: string): Promise<{
        id: string;
        taskId: string;
        shotIndex: number;
        sceneText: string | null;
        cameraAngle: string | null;
        characterAction: string | null;
        imagePrompt: string | null;
        imageUrl: string | null;
        audioUrl: string | null;
        status: string;
    }[]>;
}
