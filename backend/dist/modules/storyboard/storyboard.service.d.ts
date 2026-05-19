import { PrismaService } from '../../prisma/prisma.service';
import { LLMProvider, ShotData, StoryScript, StoryboardOutput, TaskInput } from '../../providers/llm/llm.provider';
export declare class StoryboardService {
    private readonly prisma;
    private readonly llmProvider;
    private readonly logger;
    constructor(prisma: PrismaService, llmProvider: LLMProvider);
    splitIntoShots(taskId: string, script: StoryScript, input: TaskInput): Promise<ShotData[]>;
    resplitTaskShots(taskId: string): Promise<StoryboardOutput>;
    updateShot(shotId: string, data: Partial<{
        sceneText: string;
        cameraAngle: string;
        characterAction: string;
        imagePrompt: string;
    }>): Promise<{
        id: string;
        taskId: string;
        beatId: string | null;
        shotIndex: number;
        sceneText: string | null;
        cameraAngle: string | null;
        characterAction: string | null;
        actionVerb: string | null;
        imagePrompt: string | null;
        imageUrl: string | null;
        audioUrl: string | null;
        status: string;
    }>;
    getShotsByTask(taskId: string): Promise<{
        id: string;
        taskId: string;
        beatId: string | null;
        shotIndex: number;
        sceneText: string | null;
        cameraAngle: string | null;
        characterAction: string | null;
        actionVerb: string | null;
        imagePrompt: string | null;
        imageUrl: string | null;
        audioUrl: string | null;
        status: string;
    }[]>;
    getShotById(shotId: string): Promise<{
        id: string;
        taskId: string;
        beatId: string | null;
        shotIndex: number;
        sceneText: string | null;
        cameraAngle: string | null;
        characterAction: string | null;
        actionVerb: string | null;
        imagePrompt: string | null;
        imageUrl: string | null;
        audioUrl: string | null;
        status: string;
    }>;
}
