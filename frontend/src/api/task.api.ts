import { get, post } from './request';
import type {
  Task,
  Shot,
  TaskStatusResult,
  PaginatedResult,
} from '../types/index';

export interface CreateTaskParams {
  title: string;
  topic: string;
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
