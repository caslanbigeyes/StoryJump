import { ref, onUnmounted } from 'vue';
import { getTaskStatus } from '../api/task.api';
import { TaskStatus, TaskStep, type TaskStatusResult } from '../types/index';

const POLL_INTERVAL_MS = 2000;

export function useTaskPolling(taskId: string) {
  const status = ref<TaskStatus>(TaskStatus.PENDING);
  const currentStep = ref<TaskStep>(TaskStep.CREATE_SCRIPT);
  const progress = ref<number>(0);
  const error = ref<string | null>(null);

  let timer: ReturnType<typeof setInterval> | null = null;

  const stopPolling = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  const poll = async () => {
    try {
      const result: TaskStatusResult = await getTaskStatus(taskId);
      status.value = result.status;
      currentStep.value = result.currentStep;
      progress.value = result.progress;

      // 终态时自动停止轮询
      if (result.status === TaskStatus.SUCCESS || result.status === TaskStatus.FAILED) {
        stopPolling();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      error.value = message;
      // TODO: 可选择在错误时停止轮询或继续重试
    }
  };

  const startPolling = () => {
    stopPolling(); // 防止重复启动
    poll(); // 立即执行一次
    timer = setInterval(poll, POLL_INTERVAL_MS);
  };

  // 组件卸载时自动清理
  onUnmounted(() => {
    stopPolling();
  });

  return {
    status,
    currentStep,
    progress,
    error,
    startPolling,
    stopPolling,
  };
}
