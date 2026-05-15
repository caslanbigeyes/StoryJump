import { TaskService, CreateTaskDto } from './task.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ScriptService } from '../script/script.service';
import { StoryboardService } from '../storyboard/storyboard.service';
import { ImageService } from '../image/image.service';
import { TtsService } from '../tts/tts.service';
import { VideoService } from '../video/video.service';
import type { StoryScript } from '../../providers/llm/llm.provider';
interface RewriteScriptDto {
    instructions?: string;
}
interface UpdateShotDto {
    sceneText?: string;
    cameraAngle?: string;
    characterAction?: string;
    imagePrompt?: string;
}
interface ExportVideoDto {
    resolution?: string;
    format?: string;
}
export declare class TaskController {
    private readonly taskService;
    private readonly scriptService;
    private readonly storyboardService;
    private readonly imageService;
    private readonly ttsService;
    private readonly videoService;
    constructor(taskService: TaskService, scriptService: ScriptService, storyboardService: StoryboardService, imageService: ImageService, ttsService: TtsService, videoService: VideoService);
    createTask(req: any, dto: CreateTaskDto): Promise<{
        taskId: string;
        status: string;
        currentStep: string;
    }>;
    listTasks(req: any, pagination: PaginationDto): Promise<{
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
    getTask(id: string): Promise<{
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
    getTaskStatus(id: string): Promise<{
        status: string;
        currentStep: string;
        progress: number;
        errorMessage: string;
    }>;
    getTaskShots(id: string): Promise<{
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
    getTaskResult(id: string): Promise<import("../../providers/llm/llm.provider").StoryboardOutput>;
    updateTaskScript(id: string, script: StoryScript): Promise<import("../../providers/llm/llm.provider").StoryboardOutput>;
    rewriteTaskScript(id: string, dto: RewriteScriptDto): Promise<import("../../providers/llm/llm.provider").StoryboardOutput>;
    resplitTaskStoryboard(id: string): Promise<import("../../providers/llm/llm.provider").StoryboardOutput>;
    updateShot(shotId: string, dto: UpdateShotDto): Promise<{
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
    }>;
    regenerateShotImage(shotId: string): Promise<{
        imageUrl: string;
    }>;
    regenerateTaskImages(id: string): Promise<{
        total: number;
        successCount: number;
        failedCount: number;
    }>;
    regenerateShotAudio(shotId: string): Promise<{
        audioUrl: string;
    }>;
    regenerateTaskAudio(id: string): Promise<{
        total: number;
        successCount: number;
        failedCount: number;
    }>;
    retryTask(id: string, req: any): Promise<{
        taskId: string;
        status: string;
        currentStep: string;
    }>;
    getTaskVideo(id: string): Promise<{
        status: "failed";
        videoUrl: any;
        progress: number;
        resolution: string;
        format: string;
        errorMessage: string;
        assetId?: undefined;
        audioMode?: undefined;
        provider?: undefined;
    } | {
        status: "processing";
        videoUrl: any;
        progress: number;
        resolution: string;
        format: string;
        errorMessage?: undefined;
        assetId?: undefined;
        audioMode?: undefined;
        provider?: undefined;
    } | {
        status: "processing";
        videoUrl: any;
        progress: number;
        resolution?: undefined;
        format?: undefined;
        errorMessage?: undefined;
        assetId?: undefined;
        audioMode?: undefined;
        provider?: undefined;
    } | {
        status: "failed";
        videoUrl: any;
        progress: number;
        errorMessage: string;
        resolution?: undefined;
        format?: undefined;
        assetId?: undefined;
        audioMode?: undefined;
        provider?: undefined;
    } | {
        status: "idle";
        videoUrl: any;
        progress?: undefined;
        resolution?: undefined;
        format?: undefined;
        errorMessage?: undefined;
        assetId?: undefined;
        audioMode?: undefined;
        provider?: undefined;
    } | {
        status: string;
        videoUrl: string;
        assetId: string;
        resolution: string;
        format: string;
        audioMode: string;
        provider: string;
        progress?: undefined;
        errorMessage?: undefined;
    }>;
    exportTaskVideo(id: string, dto: ExportVideoDto): Promise<{
        status: "processing";
        progress: number;
        resolution: string;
        format: string;
        videoUrl: any;
    }>;
}
export {};
