import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { StoryboardOutput } from '../../providers/llm/llm.provider';
export declare class MainCharacterDto {
    name: string;
    age: number;
    gender: string;
    appearance: string;
    personality: string;
}
export declare class CreateTaskDto {
    title: string;
    topic: string;
    genre?: string;
    era?: string;
    location?: string;
    tone?: string;
    target_duration?: number;
    shot_count?: number;
    aspect_ratio?: string;
    language?: string;
    visual_style?: string;
    main_characters?: MainCharacterDto[];
}
export declare class TaskService {
    private readonly prisma;
    private readonly pipelineQueue;
    constructor(prisma: PrismaService, pipelineQueue: Queue);
    createTask(userId: string, dto: CreateTaskDto): Promise<{
        taskId: string;
        status: string;
        currentStep: string;
    }>;
    listTasks(userId: string, pagination: PaginationDto): Promise<{
        data: {
            id: string;
            title: string;
            status: string;
            currentStep: string;
            progress: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getTaskById(taskId: string): Promise<{
        shots: {
            id: string;
            status: string;
            shotIndex: number;
            taskId: string;
            sceneText: string | null;
            cameraAngle: string | null;
            characterAction: string | null;
            imagePrompt: string | null;
            imageUrl: string | null;
            audioUrl: string | null;
        }[];
    } & {
        id: string;
        title: string;
        status: string;
        currentStep: string;
        progress: number;
        inputJson: string | null;
        outputJson: string | null;
        errorMessage: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    getTaskStatus(taskId: string): Promise<{
        status: string;
        currentStep: string;
        progress: number;
        errorMessage: string;
    }>;
    getTaskShots(taskId: string): Promise<{
        id: string;
        status: string;
        shotIndex: number;
        taskId: string;
        sceneText: string | null;
        cameraAngle: string | null;
        characterAction: string | null;
        imagePrompt: string | null;
        imageUrl: string | null;
        audioUrl: string | null;
    }[]>;
    retryTask(taskId: string, userId: string): Promise<{
        taskId: string;
        status: string;
        currentStep: string;
    }>;
    getTaskResult(taskId: string): Promise<StoryboardOutput | null>;
}
