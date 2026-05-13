import { TaskService, CreateTaskDto } from './task.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class TaskController {
    private readonly taskService;
    constructor(taskService: TaskService);
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
}
