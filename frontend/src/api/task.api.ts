import { get, post, request } from './request';
import type {
  Task,
  Shot,
  TaskStatusResult,
  PaginatedResult,
  StoryScript,
  StoryboardResult,
} from '../types/index';

export interface CreateTaskParams {
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
  main_characters?: Array<{
    name: string;
    age: number;
    gender: string;
    appearance: string;
    personality: string;
  }>;
  options?: Record<string, unknown>;
}

export interface CreateTaskResult {
  taskId: string;
}

/** 创建任务 */
export function createTask(params: CreateTaskParams): Promise<CreateTaskResult> {
  return post<CreateTaskResult>('/tasks', params);
}

/** 获取任务列表（分页） */
export function getTaskList(page = 1, limit = 20): Promise<PaginatedResult<Task>> {
  return get<PaginatedResult<Task>>('/tasks', { page, limit });
}

/** 获取任务详情 */
export function getTask(taskId: string): Promise<Task> {
  return get<Task>(`/tasks/${taskId}`);
}

/** 轮询任务状态 */
export function getTaskStatus(taskId: string): Promise<TaskStatusResult> {
  return get<TaskStatusResult>(`/tasks/${taskId}/status`);
}

/** 获取任务分镜列表 */
export function getShots(taskId: string): Promise<Shot[]> {
  return get<Shot[]>(`/tasks/${taskId}/shots`);
}

export function getTaskResult(taskId: string): Promise<StoryboardResult | null> {
  return get<StoryboardResult | null>(`/tasks/${taskId}/result`);
}

export function updateTaskScript(taskId: string, script: StoryScript): Promise<StoryboardResult> {
  return request<StoryboardResult>({ url: `/tasks/${taskId}/script`, method: 'PATCH', data: script });
}

export function rewriteTaskScript(taskId: string, instructions?: string): Promise<StoryboardResult> {
  return post<StoryboardResult>(`/tasks/${taskId}/script/rewrite`, { instructions });
}

export function resplitTaskStoryboard(taskId: string): Promise<StoryboardResult> {
  return post<StoryboardResult>(`/tasks/${taskId}/storyboard/resplit`);
}

export function updateShot(
  shotId: string,
  data: Partial<Pick<Shot, 'sceneText' | 'cameraAngle' | 'characterAction' | 'imagePrompt'>>,
): Promise<Shot> {
  return request<Shot>({ url: `/tasks/shots/${shotId}`, method: 'PATCH', data });
}

export function regenerateShotImage(shotId: string): Promise<{ imageUrl: string }> {
  return post<{ imageUrl: string }>(`/tasks/shots/${shotId}/regenerate-image`);
}

export function regenerateTaskImages(taskId: string): Promise<{ total: number; successCount: number; failedCount: number }> {
  return post<{ total: number; successCount: number; failedCount: number }>(`/tasks/${taskId}/images/regenerate`);
}

export function regenerateTaskAudio(taskId: string): Promise<{ total: number; successCount: number; failedCount: number }> {
  return post<{ total: number; successCount: number; failedCount: number }>(`/tasks/${taskId}/audio/regenerate`);
}

export function regenerateShotAudio(shotId: string): Promise<{ audioUrl: string }> {
  return post<{ audioUrl: string }>(`/tasks/shots/${shotId}/regenerate-audio`);
}

export interface ExportVideoParams {
  resolution: string;
  format: string;
}

export interface VideoExportResult {
  status: 'processing' | 'ready' | 'failed';
  videoUrl: string | null;
  progress?: number;
  errorMessage?: string;
  assetId?: string;
  resolution: string;
  format: string;
  shotCount?: number;
  audioCount?: number;
  provider?: string;
}

export interface TaskVideoStatus {
  status: 'idle' | 'processing' | 'ready' | 'failed';
  videoUrl: string | null;
  progress?: number;
  errorMessage?: string;
  assetId?: string;
  resolution?: string;
  format?: string;
  audioMode?: string;
  provider?: string;
}

export function retryTask(taskId: string): Promise<CreateTaskResult> {
  return post<CreateTaskResult>(`/tasks/${taskId}/retry`);
}

export function exportTaskVideo(taskId: string, data: ExportVideoParams): Promise<VideoExportResult> {
  return post<VideoExportResult>(`/tasks/${taskId}/video/export`, data);
}

export function getTaskVideo(taskId: string): Promise<TaskVideoStatus> {
  return get<TaskVideoStatus>(`/tasks/${taskId}/video`);
}
